"use client";

import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ChoiceGroup } from "@/components/ChoiceGroup";
import { Field } from "@/components/Field";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { getDb } from "@/db/db";
import { saveVehicle } from "@/db/repo";
import { FUELS, type Fuel } from "@/db/schemas";
import { t } from "@/i18n";
import { formatWholeEuros, parseEurosToCents } from "@/lib/format";
import {
  STEPS,
  draftToVehicle,
  emptyDraft,
  needsAppreciationConfirmation,
  validateStep,
  type DraftField,
  type FieldError,
  type OnboardingDraft,
  type Step,
} from "./draft";
import { clearDraft, loadDraft, saveDraft } from "./draft-storage";

const today = () => format(new Date(), "yyyy-MM-dd");
const isElectric = (fuel?: Fuel) => fuel === "eletrico";

export function Onboarding() {
  const router = useRouter();
  const [draft, setDraft] = useState<OnboardingDraft | null>(null);
  const [errors, setErrors] = useState<Partial<Record<DraftField, FieldError>>>({});
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const firstRender = useRef(true);

  useEffect(() => {
    let active = true;
    void getDb()
      .vehicles.count()
      .then((count) => {
        if (!active) return;
        if (count > 0) router.replace("/app");
        else setDraft(loadDraft() ?? emptyDraft());
      });
    return () => {
      active = false;
    };
  }, [router]);

  useEffect(() => {
    if (!draft) return;
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    headingRef.current?.focus();
  }, [draft?.step]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!draft) {
    return <p className="text-ink-muted">{t("common.loading")}</p>;
  }

  const step = draft.step;

  function update(changes: Partial<OnboardingDraft>) {
    setDraft((current) => {
      if (!current) return current;
      const next = { ...current, ...changes };
      if ("purchasePrice" in changes || "currentValue" in changes) next.appreciationConfirmed = false;
      saveDraft(next);
      return next;
    });
    setErrors((current) => {
      const next = { ...current };
      for (const key of Object.keys(changes)) delete next[key as DraftField];
      return next;
    });
  }

  function goTo(nextStep: Step) {
    update({ step: nextStep });
    window.scrollTo({ top: 0 });
  }

  async function finish(current: OnboardingDraft) {
    setSaving(true);
    try {
      const vehicle = draftToVehicle(current, {
        id: crypto.randomUUID(),
        now: new Date(),
        defaultNickname: t("onboarding.defaultNickname"),
      });
      await saveVehicle(getDb(), vehicle);
      clearDraft();
      router.replace("/app");
    } finally {
      setSaving(false);
    }
  }

  function next(current: OnboardingDraft = draft!) {
    const stepErrors = validateStep(current.step, current, today());
    setErrors(stepErrors);
    if (Object.keys(stepErrors).length > 0) return;
    if (current.step === 2 && needsAppreciationConfirmation(current)) {
      setConfirmOpen(true);
      return;
    }
    if (current.step === 4) void finish(current);
    else goTo((current.step + 1) as Step);
  }

  const errorText = (field: DraftField) => (errors[field] ? t(`onboarding.errors.${errors[field]}`) : undefined);
  const text = (field: DraftField) => ({
    value: draft[field] ?? "",
    onChange: (value: string) => update({ [field]: value }),
    error: errorText(field),
  });

  return (
    <main className="flex flex-col gap-6">
      <header className="flex flex-col gap-3">
        <p className="text-sm text-ink-muted">{t("onboarding.progress", { step, total: STEPS.length })}</p>
        <Progress value={(step / STEPS.length) * 100} aria-label={t("onboarding.progress", { step, total: STEPS.length })} />
        <h1 ref={headingRef} tabIndex={-1} className="text-2xl font-semibold text-ink outline-none">
          {t(`onboarding.steps.${step}.title`)}
        </h1>
        <p className="text-ink-muted">{t(`onboarding.steps.${step}.hint`)}</p>
      </header>

      <form
        className="flex flex-col gap-5"
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          next();
        }}
      >
        {step === 1 ? (
          <>
            <ChoiceGroup
              label={t("onboarding.fields.fuel")}
              options={FUELS.map((fuel) => ({ value: fuel, label: t(`fuel.${fuel}`) }))}
              value={draft.fuel}
              onChange={(fuel) => update({ fuel })}
              error={errors.fuel ? t(`onboarding.errors.${errors.fuel}`) : undefined}
            />
            <div className="grid grid-cols-2 gap-4">
              <Field label={t("onboarding.fields.brand")} optional {...text("brand")} />
              <Field label={t("onboarding.fields.model")} optional {...text("model")} />
            </div>
            <Field label={t("onboarding.fields.year")} optional numeric inputMode="numeric" {...text("year")} />
          </>
        ) : null}

        {step === 2 ? (
          <>
            <Field label={t("onboarding.fields.purchasePrice")} numeric unit={t("units.euros")} {...text("purchasePrice")} />
            <Field label={t("onboarding.fields.purchaseDate")} optional type="date" max={today()} {...text("purchaseDate")} />
            <Field
              label={t("onboarding.fields.currentValue")}
              optional
              numeric
              unit={t("units.euros")}
              hint={t("onboarding.fields.currentValueHint")}
              {...text("currentValue")}
            />
            <label className="flex min-h-11 items-center gap-3 text-ink">
              <input
                type="checkbox"
                className="size-5 accent-[var(--accent)]"
                checked={draft.hasFinancing}
                onChange={(event) => update({ hasFinancing: event.target.checked })}
              />
              {t("onboarding.fields.hasFinancing")}
            </label>
            {draft.hasFinancing ? (
              <div className="flex flex-col gap-4 rounded-[16px] border border-border bg-surface p-4">
                <Field label={t("onboarding.fields.financingPrincipal")} numeric unit={t("units.euros")} {...text("financingPrincipal")} />
                <div className="grid grid-cols-2 gap-4">
                  <Field label={t("onboarding.fields.financingRate")} numeric unit={t("units.percent")} {...text("financingRate")} />
                  <Field
                    label={t("onboarding.fields.financingMonths")}
                    numeric
                    inputMode="numeric"
                    unit={t("units.months")}
                    {...text("financingMonths")}
                  />
                </div>
                <Field label={t("onboarding.fields.financingStart")} type="date" {...text("financingStart")} />
              </div>
            ) : null}
          </>
        ) : null}

        {step === 3 ? (
          <>
            <div className="flex flex-col gap-3">
              <Field
                label={t("onboarding.fields.insurance")}
                numeric
                unit={draft.insurancePeriod === "mes" ? t("units.eurosPerMonth") : t("units.eurosPerYear")}
                {...text("insurance")}
              />
              <ChoiceGroup
                label={t("onboarding.fields.insurance")}
                options={[
                  { value: "ano", label: t("onboarding.fields.insurancePeriodYear") },
                  { value: "mes", label: t("onboarding.fields.insurancePeriodMonth") },
                ]}
                value={draft.insurancePeriod}
                onChange={(insurancePeriod) => update({ insurancePeriod })}
              />
            </div>
            <Field label={t("onboarding.fields.iuc")} optional numeric unit={t("units.euros")} {...text("iuc")} />
            <Field label={t("onboarding.fields.lastInspectionDate")} optional type="date" max={today()} {...text("lastInspectionDate")} />
            <Field label={t("onboarding.fields.parkingMonth")} optional numeric unit={t("units.eurosPerMonth")} {...text("parkingMonth")} />
          </>
        ) : null}

        {step === 4 ? (
          <>
            <Field label={t("onboarding.fields.kmPerYear")} numeric inputMode="numeric" unit={t("units.km")} {...text("kmPerYear")} />
            <Field
              label={t("onboarding.fields.consumption")}
              numeric
              unit={isElectric(draft.fuel) ? t("units.kwhPer100") : t("units.litresPer100")}
              {...text("consumption")}
            />
            <Field
              label={isElectric(draft.fuel) ? t("onboarding.fields.energyPriceElectric") : t("onboarding.fields.energyPriceFuel")}
              numeric
              unit={isElectric(draft.fuel) ? t("units.perKwh") : t("units.perLitre")}
              {...text("energyPrice")}
            />
            <Field label={t("onboarding.fields.tollsMonth")} optional numeric unit={t("units.eurosPerMonth")} {...text("tollsMonth")} />
            <Field
              label={t("onboarding.fields.maintenanceYear")}
              optional
              numeric
              unit={t("units.eurosPerYear")}
              hint={t("onboarding.fields.maintenanceYearHint")}
              {...text("maintenanceYear")}
            />
            <Field label={t("onboarding.fields.tyreSet")} optional numeric unit={t("units.euros")} {...text("tyreSet")} />
          </>
        ) : null}

        <p className="text-sm text-ink-muted" aria-live="polite">
          {t("onboarding.saved")}
        </p>

        <div className="sticky bottom-0 -mx-4 flex gap-3 border-t border-border bg-bg/95 px-4 py-3 backdrop-blur">
          {step > 1 ? (
            <Button type="button" variant="outline" size="lg" onClick={() => goTo((step - 1) as Step)}>
              {t("common.back")}
            </Button>
          ) : null}
          <Button type="submit" size="lg" className="flex-1" disabled={saving}>
            {saving ? t("onboarding.saving") : step === 4 ? t("onboarding.finish") : t("common.next")}
          </Button>
        </div>
      </form>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("onboarding.appreciation.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("onboarding.appreciation.body", {
                current: formatWholeEuros(parseEurosToCents(draft.currentValue) ?? 0),
                purchase: formatWholeEuros(parseEurosToCents(draft.purchasePrice) ?? 0),
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("onboarding.appreciation.fix")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                const confirmed = { ...draft, appreciationConfirmed: true };
                update({ appreciationConfirmed: true });
                next(confirmed);
              }}
            >
              {t("onboarding.appreciation.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
