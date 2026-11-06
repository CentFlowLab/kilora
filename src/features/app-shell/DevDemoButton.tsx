"use client";

import { useState } from "react";
import { getDb } from "@/db/db";
import { seedDemoData } from "@/db/demo";

/**
 * Ferramenta de desenvolvimento, nunca vista por utilizadores: o AppShell só a mostra
 * com NODE_ENV=development e o build de produção não a inclui. Por isso o texto não está nas traduções.
 */
export function DevDemoButton() {
  const [message, setMessage] = useState<string | null>(null);

  async function seed() {
    try {
      await seedDemoData(getDb());
      window.location.reload();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
    }
  }

  return (
    <div className="mt-10 rounded-[12px] border border-dashed border-warn p-3 text-sm text-ink-muted">
      <button type="button" onClick={seed} className="min-h-11 font-medium text-warn underline underline-offset-4">
        [dev] Preencher dados de demonstração
      </button>
      {message ? <p className="mt-2">{message}</p> : null}
    </div>
  );
}
