"use client";

import { format } from "date-fns";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ChoiceGroup } from "@/components/ChoiceGroup";
import { Button } from "@/components/ui/button";
import { getDb } from "@/db/db";
import { getSettings } from "@/db/repo";
import type { Settings, Vehicle } from "@/db/schemas";
import { dashboardSummary, type DashboardSummary } from "@/engine/dashboard";
import { loadDraft } from "@/features/onboarding/draft-storage";
import { t } from "@/i18n";
import { formatDate, formatEuros, formatList, formatNumber, formatPerKm, formatWholeEuros } from "@/lib/format";
import { useCountUp } from "@/lib/use-count-up";
import { CategoryChart } from "./CategoryChart";
import { ExplainDialog } from "./ExplainDialog";

type Period = "month" | "year" | "km";

type State =
  | { status: "loading" }
  | { status: "empty"; hasDraft: boolean }
  | { status: "ready"; vehicle: Vehicle; summary: DashboardSummary };

export function Dashboard() {
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    let active = true;
    void load().then((next) => {
      if (active) setState(next);
    });
    return () => {
      active = false;
    };
  }, []);

  if (state.status === "loading") return <p className="text-ink-muted">{t("common.loading")}</p>;
  if (state.status === "empty") return <EmptyState hasDraft={state.hasDraft} />;
  return <Summary vehicle={state.vehicle} summary={state.summary} />;
}

async function load(): Promise<State> {
  const db = getDb();
  const vehicles = await db.vehicles.orderBy("createdAt").toArray();
  const vehicle = vehicles.find((candidate) => !candidate.soldDate) ?? vehicles[0];
  if (!vehicle) return { status: "empty", hasDraft: loadDraft() !== null };

  const settings: Settings = await getSettings(db);
  const summary = dashboardSummary(vehicle, {
    asOf: format(new Date(), "yyyy-MM-dd"),
    opportunityCost: settings.opportunityCost,
  });
  return { status: "ready", vehicle, summary };
}

function EmptyState({ hasDraft }: { hasDraft: boolean }) {
  return (
    <main className="flex flex-1 flex-col items-start justify-center gap-4">
      <h1 className="text-2xl font-semibold text-ink">{t("dashboard.empty.title")}</h1>
      <p className="text-ink-muted">{t("dashboard.empty.body")}</p>
      <Button asChild size="lg">
        <Link href="/app/boas-vindas">{hasDraft ? t("dashboard.empty.continue") : t("dashboard.empty.start")}</Link>
      </Button>
    </main>
  );
}

function Summary({ vehicle, summary }: { vehicle: Vehicle; summary: DashboardSummary }) {
  const [period, setPeriod] = useState<Period>("month");
  const { result } = summary;

  const notes: string[] = [];
  if (vehicle.soldDate) notes.push(t("dashboard.notes.sold", { date: formatDate(vehicle.soldDate) }));
  if (result.missing.length > 0) {
    notes.push(t("dashboard.notes.missing", { items: formatList(result.missing.map((item) => t(`dashboard.missingItems.${item}`))) }));
  }
  if (result.appreciated) notes.push(t("dashboard.notes.appreciated"));
  if (result.estimated.includes("depreciation")) {
    notes.push(t("dashboard.notes.depreciationEstimated", { rate: formatNumber(result.depreciation.ratePct, 1) }));
  }

  return (
    <main className="flex flex-col gap-6">
      <header>
        <p className="text-sm text-ink-muted">{vehicle.nickname}</p>
      </header>

      <section className="flex flex-col gap-4 rounded-[16px] border border-border bg-surface p-5" aria-labelledby="total-title">
        <h1 id="total-title" className="sr-only">
          {t("dashboard.period.label")}
        </h1>
        <BigNumber period={period} summary={summary} />
        <ChoiceGroup
          label={t("dashboard.period.label")}
          columns={3}
          value={period}
          onChange={setPeriod}
          options={[
            { value: "month", label: t("dashboard.period.month") },
            { value: "year", label: t("dashboard.period.year") },
            { value: "km", label: t("dashboard.period.km") },
          ]}
        />
        <p className="text-sm text-ink-muted">{t("dashboard.estimateNote")}</p>
        <ExplainDialog steps={summary.explain} fuel={vehicle.fuel} />
      </section>

      {notes.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {notes.map((note) => (
            <li key={note} className="rounded-[12px] border border-border bg-accent-soft px-4 py-3 text-sm text-ink">
              {note}
            </li>
          ))}
        </ul>
      ) : null}

      <FixedVariable summary={summary} />
      {summary.categories.length > 0 ? <CategoryChart slices={summary.categories} /> : null}

      {summary.tips.length > 0 ? (
        <section className="rounded-[16px] border border-border bg-surface p-4" aria-labelledby="tips-title">
          <h2 id="tips-title" className="mb-2 text-lg font-semibold text-ink">
            {t("dashboard.tips.title")}
          </h2>
          <ul className="flex list-disc flex-col gap-2 pl-5 text-sm text-ink">
            {summary.tips.map((tip) => (
              <li key={tip}>{t(`dashboard.tips.${tip}`)}</li>
            ))}
          </ul>
        </section>
      ) : null}
    </main>
  );
}

function BigNumber({ period, summary }: { period: Period; summary: DashboardSummary }) {
  const { result } = summary;
  const target = period === "month" ? result.totalMonth : period === "year" ? result.totalYear : (result.perKm ?? 0);
  const shown = useCountUp(target);

  if (period === "km" && result.perKm === null) {
    return <p className="text-ink-muted">{t("dashboard.period.noKm")}</p>;
  }

  const text = period === "month" ? formatEuros(shown) : period === "year" ? formatWholeEuros(shown) : formatPerKm(shown);
  const suffix =
    period === "month" ? t("dashboard.period.perMonth") : period === "year" ? t("dashboard.period.perYear") : t("dashboard.period.perKm");

  return (
    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-2" aria-live="polite">
      <p className="text-5xl font-semibold tabular-nums text-ink">{text}</p>
      <p className="text-lg text-ink-muted">{suffix}</p>
      <span className="rounded-full bg-accent-soft px-2.5 py-1 text-xs font-medium text-accent">{t("dashboard.estimated")}</span>
    </div>
  );
}

function FixedVariable({ summary }: { summary: DashboardSummary }) {
  const { result, share } = summary;
  return (
    <section className="rounded-[16px] border border-border bg-surface p-4" aria-labelledby="fixed-variable-title">
      <h2 id="fixed-variable-title" className="mb-3 text-lg font-semibold text-ink">
        {t("dashboard.fixedVariable.title")}
      </h2>
      <div className="flex h-3 overflow-hidden rounded-full bg-surface-2" aria-hidden="true">
        <div className="bg-accent" style={{ width: `${share.fixedPct}%` }} />
        <div className="bg-ink-muted" style={{ width: `${share.variablePct}%` }} />
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
        <div>
          <dt className="font-medium text-ink">
            {t("dashboard.fixedVariable.fixed")} · {formatNumber(share.fixedPct)} %
          </dt>
          <dd className="tabular-nums text-ink">{t("dashboard.categories.perYear", { value: formatWholeEuros(result.fixedYear) })}</dd>
          <dd className="text-ink-muted">{t("dashboard.fixedVariable.fixedHint")}</dd>
        </div>
        <div>
          <dt className="font-medium text-ink">
            {t("dashboard.fixedVariable.variable")} · {formatNumber(share.variablePct)} %
          </dt>
          <dd className="tabular-nums text-ink">
            {t("dashboard.categories.perYear", { value: formatWholeEuros(result.variableYear) })}
          </dd>
          <dd className="text-ink-muted">{t("dashboard.fixedVariable.variableHint")}</dd>
        </div>
      </dl>
    </section>
  );
}
