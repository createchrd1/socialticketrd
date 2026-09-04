import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState } from "react";
import { Send, Sparkles, Check, Loader2, Search, Tag, UserPlus, Flag } from "lucide-react";
import { toast } from "sonner";

import { NetworkBadge, NetworkIcon } from "@/components/NetworkBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { suggestReply } from "@/lib/ai.functions";
import { PriorityBadge } from "@/components/PriorityBadge";
import { platformLabels, startAdsSync, useCampaigns } from "@/lib/ads-store";
import {
  focusConversation,
  sortByPriority,
  updateConversation,
  useConversations,
  useFocusId,
  useReady,
  sendReply,
} from "@/lib/conversations-store";
import {
  allTags,
  networkLabels,
  priorityLabels,
  team,
  type Network,
  type Priority,
  type Status,
} from "@/lib/demo-data";

const statusLabels: Record<Status, string> = {
  pendiente: "Pendiente",
  en_proceso: "En proceso",
  resuelto: "Resuelto",
};

const statusClasses: Record<Status, string> = {
  pendiente: "border-warning/40 bg-warning/10 text-warning",
  en_proceso: "border-accent/40 bg-accent/10 text-accent",
  resuelto: "border-success/40 bg-success/10 text-success",
};

const filters: Array<{ id: Network | "todas"; label: string }> = [
  { id: "todas", label: "Todas" },
  { id: "instagram", label: networkLabels.instagram },
  { id: "facebook", label: networkLabels.facebook },
  { id: "x", label: networkLabels.x },
  { id: "tiktok", label: networkLabels.tiktok },
];

export function Inbox({ channel }: { channel?: Network }) {
  const items = useConversations();
  const ready = useReady();
  const focusId = useFocusId();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [priorityFilter, setPriorityFilter] = useState<Priority | "todas">("todas");
  const [filter, setFilter] = useState<Network | "todas">("todas");
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState("");
  const [loadingAi, setLoadingAi] = useState(false);
  const askAi = useServerFn(suggestReply);

  const scoped = useMemo(
    () => (channel ? items.filter((c) => c.network === channel) : items),
    [items, channel],
  );

  const visible = useMemo(
    () =>
      sortByPriority(scoped).filter(
        (c) =>
          (channel || filter === "todas" || c.network === filter) &&
          (priorityFilter === "todas" || c.priority === priorityFilter) &&
          (query.trim() === "" ||
            (c.person + c.handle + c.messages.map((m) => m.text).join(" "))
              .toLowerCase()
              .includes(query.toLowerCase())),
      ),
    [scoped, filter, priorityFilter, query, channel],
  );

  useEffect(() => {
    setActiveId(null);
    setDraft("");
  }, [channel]);

  useEffect(() => {
    if (!focusId) return;
    if (!scoped.some((c) => c.id === focusId)) return;
    setActiveId(focusId);
    setDraft("");
    void updateConversation(focusId, { unread: false });
    focusConversation(null);
  }, [focusId, scoped]);

  const active = scoped.find((c) => c.id === activeId) ?? visible[0] ?? scoped[0] ?? null;
  const pendientes = scoped.filter((c) => c.status === "pendiente").length;

  const send = async () => {
    if (!draft.trim() || !active) return;
    const texto = draft.trim();
    const red = networkLabels[active.network];
    setDraft("");
    await sendReply(active.id, texto);
    toast.success(`Respuesta enviada por ${red} y guardada en la nube`);
  };

  const suggest = async () => {
    if (!active) return;
    setLoadingAi(true);
    try {
      const res = await askAi({
        data: {
          network: networkLabels[active.network],
          person: active.person,
          history: active.messages.map((m) => ({ from: m.from, text: m.text })),
          tone: "cordial",
        },
      });
      setDraft(res.reply);
    } catch {
      toast.error("No se pudo generar la sugerencia. Intenta de nuevo.");
    } finally {
      setLoadingAi(false);
    }
  };

  return (
    <>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">
            {channel ? `Canal ${networkLabels[channel]}` : "Bandeja unificada"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {pendientes} conversaciones esperan tu respuesta.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar personas o mensajes"
              className="w-60 bg-surface pl-9"
            />
          </div>
          {(["todas", "alta", "media", "baja"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPriorityFilter(p)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                priorityFilter === p
                  ? "border-accent bg-accent/15 text-accent"
                  : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {p === "todas" ? "Toda prioridad" : priorityLabels[p]}
            </button>
          ))}
          {!channel &&
            filters.map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                  filter === f.id
                    ? "border-primary bg-primary/15 text-primary"
                    : "border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {f.label}
              </button>
            ))}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
        <section className="panel max-h-[72vh] overflow-y-auto p-2">
          {visible.length === 0 && (
            <p className="p-6 text-center text-sm text-muted-foreground">
              {ready ? "Sin conversaciones aquí." : "Cargando conversaciones…"}
            </p>
          )}
          {visible.map((c) => (
            <button
              key={c.id}
              onClick={() => {
                setActiveId(c.id);
                setDraft("");
                void updateConversation(c.id, { unread: false });
              }}
              className={`mb-1 flex w-full gap-3 rounded-lg p-3 text-left transition-colors ${
                c.id === active?.id ? "bg-surface-2" : "hover:bg-surface-2/60"
              }`}
            >
              <span
                className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold"
                style={{ backgroundColor: c.avatarColor, color: "oklch(0.18 0.02 260)" }}
              >
                {c.person.charAt(0)}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <span className="truncate text-sm font-semibold">{c.person}</span>
                  <NetworkIcon network={c.network} className="h-3.5 w-3.5 shrink-0" />
                  {c.unread && <span className="h-2 w-2 rounded-full bg-primary" />}
                  <span className="ml-auto shrink-0 text-[11px] text-muted-foreground">
                    {c.lastAt}
                  </span>
                </span>
                <span className="mt-1 block truncate text-xs text-muted-foreground">
                  {c.messages[c.messages.length - 1]!.text}
                </span>
                <span className="mt-2 flex flex-wrap items-center gap-1.5">
                  <PriorityBadge priority={c.priority} />
                  <span
                    className={`rounded-full border px-1.5 py-0.5 text-[10px] ${statusClasses[c.status]}`}
                  >
                    {statusLabels[c.status]}
                  </span>
                  {c.tags.map((t) => (
                    <span
                      key={t}
                      className="rounded-full bg-secondary px-1.5 py-0.5 text-[10px] text-secondary-foreground"
                    >
                      {t}
                    </span>
                  ))}
                </span>
              </span>
            </button>
          ))}
        </section>

        <section className="panel flex max-h-[72vh] flex-col">
          {!active ? (
            <p className="m-auto p-8 text-center text-sm text-muted-foreground">
              No hay conversaciones en este canal por ahora.
            </p>
          ) : (
            <>
              <header className="flex flex-wrap items-center gap-3 border-b border-border p-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-semibold">{active.person}</h2>
                    <NetworkBadge network={active.network} />
                    <PriorityBadge priority={active.priority} />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {active.handle} · {active.kind}
                    {campaign && (
                      <>
                        {" · llegó desde "}
                        <span className="text-accent">
                          {platformLabels[campaign.platform]}: {campaign.name}
                        </span>
                      </>
                    )}
                  </p>
                </div>
                <div className="ml-auto flex flex-wrap items-center gap-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Flag className="mr-1.5 h-3.5 w-3.5" />
                        {priorityLabels[active.priority]}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {(["alta", "media", "baja"] as const).map((p) => (
                        <DropdownMenuItem
                          key={p}
                          onClick={() => void updateConversation(active.id, { priority: p })}
                        >
                          {active.priority === p && <Check className="mr-2 h-3.5 w-3.5" />}
                          {priorityLabels[p]}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        <UserPlus className="mr-1.5 h-3.5 w-3.5" />
                        {active.assignee ?? "Asignar"}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {team.map((p) => (
                        <DropdownMenuItem
                          key={p}
                          onClick={() => void updateConversation(active.id, { assignee: p })}
                        >
                          {p}
                        </DropdownMenuItem>
                      ))}
                      <DropdownMenuItem
                        onClick={() => void updateConversation(active.id, { assignee: null })}
                      >
                        Sin asignar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Tag className="mr-1.5 h-3.5 w-3.5" />
                        Etiquetas
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {allTags.map((t) => (
                        <DropdownMenuItem
                          key={t}
                          onClick={() =>
                            void updateConversation(active.id, {
                              tags: active.tags.includes(t)
                                ? active.tags.filter((x) => x !== t)
                                : [...active.tags, t],
                            })
                          }
                        >
                          {active.tags.includes(t) && <Check className="mr-2 h-3.5 w-3.5" />}
                          {t}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <Button
                    variant={active.status === "resuelto" ? "secondary" : "default"}
                    size="sm"
                    onClick={() =>
                      void updateConversation(active.id, {
                        status: active.status === "resuelto" ? "pendiente" : "resuelto",
                      })
                    }
                  >
                    <Check className="mr-1.5 h-3.5 w-3.5" />
                    {active.status === "resuelto" ? "Reabrir" : "Resuelto"}
                  </Button>
                </div>
              </header>

              <div className="flex-1 space-y-3 overflow-y-auto p-4">
                {active.messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex ${m.from === "yo" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[75%] rounded-xl px-3.5 py-2.5 text-sm ${
                        m.from === "yo"
                          ? "bg-primary text-primary-foreground"
                          : "bg-surface-2 text-foreground"
                      }`}
                    >
                      <p>{m.text}</p>
                      <p className="mt-1 text-[10px] opacity-70">{m.at}</p>
                    </div>
                  </div>
                ))}
              </div>

              <footer className="border-t border-border p-4">
                <Textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder={`Responder a ${active.person} por ${networkLabels[active.network]}…`}
                  className="min-h-[88px] resize-none bg-surface-2"
                />
                <div className="mt-3 flex items-center justify-between gap-2">
                  <Button variant="outline" size="sm" onClick={suggest} disabled={loadingAi}>
                    {loadingAi ? (
                      <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                    )}
                    Sugerir respuesta
                  </Button>
                  <Button size="sm" onClick={() => void send()} disabled={!draft.trim()}>
                    <Send className="mr-1.5 h-3.5 w-3.5" />
                    Enviar
                  </Button>
                </div>
              </footer>
            </>
          )}
        </section>
      </div>
    </>
  );
}
