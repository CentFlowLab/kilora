import { AppShell } from "@/features/app-shell/AppShell";

export default function AppLayout({ children }: LayoutProps<"/app">) {
  return <AppShell>{children}</AppShell>;
}
