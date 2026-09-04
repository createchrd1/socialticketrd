import { Link } from "@tanstack/react-router";
import { Inbox, BarChart3, Radio, History, BellRing, SlidersHorizontal } from "lucide-react";
import type { ReactNode } from "react";

import { NetworkIcon } from "@/components/NetworkBadge";
import { NewMessageWatcher } from "@/components/NewMessageWatcher";
import { Button } from "@/components/ui/button";
import { NotificationsButton } from "@/components/NotificationsButton";
import { receiveDemoMessage, useConversations } from "@/lib/conversations-store";
import { networkLabels, type Network } from "@/lib/demo-data";

const channels: Network[] = ["instagram", "facebook", "x", "tiktok"];

export function AppShell({ children }: { children: ReactNode }) {
  const items = useConversations();
  const sinLeer = items.filter((c) => c.unread).length;

  return (
    <div className="min-h-screen bg-background">
      <NewMessageWatcher />
      <header className="sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-[1400px] items-center gap-6 px-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Radio className="h-5 w-5" />
            </span>
            <span className="font-sans text-lg font-semibold tracking-tight">Señal</span>
          </div>
          <nav className="flex flex-wrap items-center gap-1">
            <Link
              to="/"
              activeOptions={{ exact: true }}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground data-[status=active]:bg-secondary data-[status=active]:text-foreground"
            >
              <Inbox className="h-4 w-4" />
              Bandeja
            </Link>
            {channels.map((n) => (
              <Link
                key={n}
                to="/canal/$network"
                params={{ network: n }}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground data-[status=active]:bg-secondary data-[status=active]:text-foreground"
              >
                <NetworkIcon network={n} className="h-4 w-4" />
                <span className="hidden md:inline">{networkLabels[n]}</span>
              </Link>
            ))}
            <Link
              to="/historial"
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground data-[status=active]:bg-secondary data-[status=active]:text-foreground"
            >
              <History className="h-4 w-4" />
              <span className="hidden md:inline">Historial</span>
            </Link>
            <Link
              to="/reglas"
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground data-[status=active]:bg-secondary data-[status=active]:text-foreground"
            >
              <SlidersHorizontal className="h-4 w-4" />
              <span className="hidden lg:inline">Reglas</span>
            </Link>
            <Link
              to="/panel"
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground data-[status=active]:bg-secondary data-[status=active]:text-foreground"
            >
              <BarChart3 className="h-4 w-4" />
              Panel
            </Link>
          </nav>
          <div className="ml-auto flex items-center gap-3">
            {sinLeer > 0 && (
              <span className="flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                <BellRing className="h-3.5 w-3.5" />
                {sinLeer} sin leer
              </span>
            )}
            <NotificationsButton />
            <Button variant="outline" size="sm" onClick={() => void receiveDemoMessage()}>
              Simular mensaje
            </Button>
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
