"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import type { Fuel } from "@/db/schemas";
import type { ExplainStep } from "@/engine/vehicle-cost";
import { t } from "@/i18n";
import { explainLine } from "./explain-text";

export function ExplainDialog({ steps, fuel }: { steps: ExplainStep[]; fuel: Fuel }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="link" className="h-11 px-0 text-accent">
          {t("explain.button")}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("explain.title")}</DialogTitle>
          <DialogDescription>{t("explain.intro")}</DialogDescription>
        </DialogHeader>
        <ol className="flex flex-col gap-2 text-sm text-ink">
          {steps.map((step) => (
            <li
              key={step.id}
              className={
                step.id.endsWith("total") || step.id.startsWith("total") || step.id === "per-km"
                  ? "border-t border-border pt-2 font-medium tabular-nums"
                  : "tabular-nums"
              }
            >
              {explainLine(step, fuel)}
            </li>
          ))}
        </ol>
      </DialogContent>
    </Dialog>
  );
}
