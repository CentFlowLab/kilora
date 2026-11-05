import { t } from "@/i18n";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-[720px] flex-1 flex-col justify-center gap-4 px-4 py-16">
      <h1 className="text-2xl font-semibold text-ink">{t("home.title")}</h1>
      <p className="text-base text-ink-muted">{t("home.subtitle")}</p>
    </main>
  );
}
