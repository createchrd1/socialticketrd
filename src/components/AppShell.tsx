import { Link } from "@tanstack/react-router";
import { Inbox, BarChart3, Radio } from "lucide-react";
import type { ReactNode } from "react";

const nav = [
  { to: "/", label: "Bandeja", icon: Inbox },
  { to: "/panel", label: "Panel", icon: BarChart3 },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-[1400px] items-center gap-6 px-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Radio className="h-5 w-5" />
            </span>
            <span className="font-sans text-lg font-semibold tracking-tight">Señal</span>
          </div>
          <nav className="flex items-center gap-1">
            {nav.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                activeOptions={{ exact: to === "/" }}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground data-[status=active]:bg-secondary data-[status=active]:text-foreground"
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-3">
            <span className="hidden rounded-full border border-border px-3 py-1 text-xs text-muted-foreground sm:inline">
              Modo demostración
            </span>
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-xs font-semibold">
              AQ
            </span>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6">{children}</main>
    </div>
  );
}
