import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { NetworkBadge } from "@/components/NetworkBadge";
import { PriorityBadge } from "@/components/PriorityBadge";
import { Input } from "@/components/ui/input";
import { sortByPriority, useConversations } from "@/lib/conversations-store";
import { networkLabels } from "@/lib/demo-data";

export const Route = createFileRoute("/historial")({
  head: () => ({
    meta: [
      { title: "Historial de conversaciones — Señal" },
      {
        name: "description",
        content:
          "Revisa todas las conversaciones guardadas de Instagram, Facebook, X y TikTok, con cada mensaje recibido y cada respuesta enviada.",
      },
      { property: "og:title", content: "Historial de conversaciones — Señal" },
      {
        property: "og:description",
        content: "Cada mensaje recibido y cada respuesta enviada, guardados y listos para consultar.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Historial,
});

function Historial() {
  const items = useConversations();
  const [query, setQuery] = useState("");

  const visible = useMemo(
    () =>
      sortByPriority(items).filter(
        (c) =>
          query.trim() === "" ||
          (c.person + c.handle + c.messages.map((m) => m.text).join(" "))
            .toLowerCase()
            .includes(query.toLowerCase()),
      ),
    [items, query],
  );

  const respuestas = items.reduce(
    (n, c) => n + c.messages.filter((m) => m.from === "yo").length,
    0,
  );
  const recibidos = items.reduce(
    (n, c) => n + c.messages.filter((m) => m.from === "cliente").length,
    0,
  );

  return (
    <AppShell>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Historial de conversaciones</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {recibidos} mensajes recibidos y {respuestas} respuestas guardadas en este dispositivo.
          </p>
        </div>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar en el historial"
            className="w-64 bg-surface pl-9"
          />
        </div>
      </div>

      <div className="space-y-4">
        {visible.length === 0 && (
          <p className="panel p-8 text-center text-sm text-muted-foreground">
            No encontramos conversaciones con ese texto.
          </p>
        )}
        {visible.map((c) => (
          <article key={c.id} className="panel p-4">
            <header className="mb-3 flex flex-wrap items-center gap-2">
              <span
                className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold"
                style={{ backgroundColor: c.avatarColor, color: "oklch(0.18 0.02 260)" }}
              >
                {c.person.charAt(0)}
              </span>
              <h2 className="text-sm font-semibold">{c.person}</h2>
              <NetworkBadge network={c.network} />
              <PriorityBadge priority={c.priority} />
              <span className="ml-auto text-xs text-muted-foreground">
                {c.handle} · {networkLabels[c.network]} · {c.lastAt}
              </span>
            </header>
            <div className="space-y-2">
              {c.messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex ${m.from === "yo" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[75%] rounded-xl px-3 py-2 text-sm ${
                      m.from === "yo"
                        ? "bg-primary text-primary-foreground"
                        : "bg-surface-2 text-foreground"
                    }`}
                  >
                    <p>{m.text}</p>
                    <p className="mt-1 text-[10px] opacity-70">
                      {m.from === "yo" ? "Tu respuesta" : "Recibido"} · {m.at}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </article>
        ))}
      </div>
    </AppShell>
  );
}
