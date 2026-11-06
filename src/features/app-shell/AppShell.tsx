"use client";

import { useEffect, type ReactNode } from "react";
import { getDb } from "@/db/db";
import { requestPersistentStorage } from "@/db/persist";
import { getSettings } from "@/db/repo";
import type { Settings } from "@/db/schemas";
import { DevDemoButton } from "./DevDemoButton";

const THEME_ATTRIBUTE: Record<Settings["theme"], string | null> = {
  claro: "light",
  escuro: "dark",
  auto: null,
};

export function applyTheme(theme: Settings["theme"]) {
  const value = THEME_ATTRIBUTE[theme];
  if (value) document.documentElement.dataset.theme = value;
  else delete document.documentElement.dataset.theme;
}

export function AppShell({ children }: { children: ReactNode }) {
  useEffect(() => {
    void requestPersistentStorage();
    void getSettings(getDb()).then((settings) => applyTheme(settings.theme));
  }, []);

  return (
    <div className="mx-auto flex w-full max-w-[720px] flex-1 flex-col px-4 pb-8 pt-6">
      {children}
      {process.env.NODE_ENV === "development" ? <DevDemoButton /> : null}
    </div>
  );
}
