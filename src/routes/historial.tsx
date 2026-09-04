import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { NetworkBadge } from "@/components/NetworkBadge";
import { PriorityBadge } from "@/components/PriorityBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { sortByPriority, useConversations, useReady } from "@/lib/conversations-store";
import {
  allTags,
  networkLabels,
  priorityLabels,
  type Network,
  type Priority,
  type Status,
} from "@/lib/demo-data";

export const Route = createFileRoute("/historial")({
  head: () => ({
    meta: [
      { title: "Historial de conversaciones — Señal" },
      {
        name: "description",
        content:
          "Busca y filtra todas las conversaciones guardadas de Instagram, Facebook, X y TikTok por canal, prioridad, etiqueta y texto.",
      },
      { property: "og:title", content: "Historial de conversaciones — Señal" },
      {
        property: "og:description",
        content: "Cada mensaje recibido y cada respuesta enviada, guardados en la nube y fáciles de encontrar.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Historial,
});

const estadoLabels: Record<Status, string> = {
  pendiente: "Pendiente",
  en_proceso: "En proceso",
  resuelto: "Resuelto",
};

function Historial() {
  const items = useConversations();
  const ready = useReady();
  const [query, setQuery] = useState("");
  const [canal, setCanal] = useState<Network | "todos">("todos");
  const [prioridad, setPrioridad] = useState<Priority | "todas">("todas");
  const [etiqueta, setEtiqueta] = useState<string>("todas");
  const [estado, setEstado] = useState<Status | "todos">("todos");

  const visible = useMemo(
    () =>
      sortByPriority(items).filter((c) => {
        if (canal !== "todos" && c.network !== canal) return false;
        if (prioridad !== "todas" && c.priority !== prioridad) return false;
        if (etiqueta !== "todas" && !c.tags.includes(etiqueta)) return false;
        if (estado !== "todos" && c.status !== estado) return false;
        if (query.trim() === "") return true;
        return (c.person + c.handle + c.messages.map((m) => m.text).join(" "))
          .toLowerCase()
          .includes(query.toLowerCase());
      }),
    [items, query, canal, prioridad, etiqueta, estado],
  );

  const respuestas = items.reduce(
    (n, c) => n + c.messages.filter((m) => m.from === "yo").length,
    0,
  );
  const recibidos = items.reduce(
    (n, c) => n + c.messages.filter((m) => m.from === "cliente").length,
    0,
  );

  const hayFiltros =
    query !== "" || canal !== "todos" || prioridad !== "todas" || etiqueta !== "todas" || estado !== "todos";

  const limpiar = () => {
    setQuery("");
    setCanal("todos");
    setPrioridad("todas");
    setEtiqueta("todas");
    setEstado("todos");
  };

  return (
    <AppShell>
      <div className="mb-4">
        <h1 className="text-2xl font-semibold">Historial de conversaciones</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {recibidos} mensajes recibidos y {respuestas} respuestas guardadas en la nube.
        </p>
      </div>

      <div className="panel mb-5 flex flex-wrap items-end gap-3 p-4">
        <div className="relative min-w-[220px] flex-1">
          <label className="mb-1 block text-xs text-muted-foreground">Buscar texto</label>
          <Search className="pointer-events-none absolute left-3 top-[34px] h-4 w-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Persona, usuario o palabra del mensaje"
            className="bg-surface-2 pl-9"
          />
        </div>

        <div className="w-40">
          <label className="mb-1 block text-xs text-muted-foreground">Canal</label>
          <Select value={canal} onValueChange={(v) => setCanal(v as Network | "todos")}>
            <SelectTrigger className="bg-surface-2">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              {(["instagram", "facebook", "x", "tiktok"] as const).map((n) => (
                <SelectItem key={n} value={n}>
                  {networkLabels[n]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="w-36">
          <label className="mb-1 block text-xs text-muted-foreground">Prioridad</label>
          <Select value={prioridad} onValueChange={(v) => setPrioridad(v as Priority | "todas")}>
            <SelectTrigger className="bg-surface-2">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas</SelectItem>
              {(["alta", "media", "baja"] as const).map((p) => (
                <SelectItem key={p} value={p}>
                  {priorityLabels[p]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="w-40">
          <label className="mb-1 block text-xs text-muted-foreground">Etiqueta</label>
          <Select value={etiqueta} onValueChange={setEtiqueta}>
            <SelectTrigger className="bg-surface-2">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas</SelectItem>
              {allTags.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="w-40">
          <label className="mb-1 block text-xs text-muted-foreground">Estado</label>
          <Select value={estado} onValueChange={(v) => setEstado(v as Status | "todos")}>
            <SelectTrigger className="bg-surface-2">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              {(["pendiente", "en_proceso", "resuelto"] as const).map((s) => (
                <SelectItem key={s} value={s}>
                  {estadoLabels[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {hayFiltros && (
          <Button variant="ghost" size="sm" onClick={limpiar}>
            <X className="mr-1.5 h-3.5 w-3.5" />
            Limpiar
          </Button>
        )}
      </div>

      <p className="mb-3 text-xs text-muted-foreground">
        {visible.length} de {items.length} conversaciones
      </p>

      <div className="space-y-4">
        {visible.length === 0 && (
          <p className="panel p-8 text-center text-sm text-muted-foreground">
            {ready ? "No encontramos conversaciones con esos filtros." : "Cargando historial…"}
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
              <span className="rounded-full bg-secondary px-1.5 py-0.5 text-[10px] text-secondary-foreground">
                {estadoLabels[c.status]}
              </span>
              {c.tags.map((t) => (
                <span
                  key={t}
                  className="rounded-full bg-secondary px-1.5 py-0.5 text-[10px] text-secondary-foreground"
                >
                  {t}
                </span>
              ))}
              <span className="ml-auto text-xs text-muted-foreground">
                {c.handle} · {c.lastAt}
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
