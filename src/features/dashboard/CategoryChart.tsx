"use client";

import { Pie, PieChart, ResponsiveContainer } from "recharts";
import type { CategorySlice } from "@/engine/dashboard";
import type { CostCategory } from "@/engine/vehicle-cost";
import { t } from "@/i18n";
import { formatEuros, formatNumber } from "@/lib/format";

const COLORS: Record<CostCategory, string> = {
  depreciation: "var(--chart-1)",
  insurance: "var(--chart-2)",
  energy: "var(--chart-3)",
  maintenance: "var(--chart-4)",
  taxes: "var(--chart-5)",
  other: "var(--chart-6)",
};

export function CategoryChart({ slices }: { slices: CategorySlice[] }) {
  const data = slices.map((slice) => ({
    name: t(`dashboard.categories.${slice.category}`),
    value: slice.yearCents,
    fill: COLORS[slice.category],
  }));

  return (
    <section className="rounded-[16px] border border-border bg-surface p-4" aria-labelledby="categories-title">
      <h2 id="categories-title" className="mb-3 text-lg font-semibold text-ink">
        {t("dashboard.categories.title")}
      </h2>
      <div className="flex flex-col items-center gap-4 sm:flex-row">
        <div className="size-44 shrink-0" aria-hidden="true">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                innerRadius="58%"
                outerRadius="100%"
                stroke="var(--surface)"
                strokeWidth={2}
                isAnimationActive={false}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <ul className="flex w-full flex-col gap-2">
          {slices.map((slice) => (
            <li key={slice.category} className="flex items-center gap-3 text-sm">
              <span className="size-3 shrink-0 rounded-full" style={{ background: COLORS[slice.category] }} aria-hidden="true" />
              <span className="flex-1 text-ink">{t(`dashboard.categories.${slice.category}`)}</span>
              <span className="tabular-nums text-ink-muted">{formatNumber(slice.pct)} %</span>
              <span className="shrink-0 whitespace-nowrap text-right tabular-nums text-ink">
                {t("dashboard.categories.perYear", { value: formatEuros(slice.yearCents, 0) })}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
