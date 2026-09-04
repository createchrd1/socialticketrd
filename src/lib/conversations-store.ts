import { useSyncExternalStore } from "react";

import { supabase } from "@/integrations/supabase/client";
import { incomingSamples, priorityRank, type Conversation, type Priority } from "@/lib/demo-data";
import { evaluatePriority, type PriorityRule, type SenderKind } from "@/lib/priority-rules";

type ConversationRow = {
  id: string;
  network: string;
  kind: string;
  person: string;
  handle: string;
  avatar_color: string;
  unread: boolean;
  status: string;
  priority: string;
  assignee: string | null;
  tags: string[];
  created_at: string;
  updated_at: string;
};

type MessageRow = {
  id: string;
  conversation_id: string;
  sender: string;
  body: string;
  created_at: string;
};

type RuleRow = {
  id: string;
  name: string;
  enabled: boolean;
  network: string | null;
  keywords: string[];
  sender_kind: string | null;
  priority: string;
  position: number;
};

const hora = (iso: string) =>
  new Date(iso).toLocaleTimeString("es-BO", { hour: "2-digit", minute: "2-digit" });

function relativo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.round(diff / 60000);
  if (min < 1) return "ahora";
  if (min < 60) return `hace ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.round(h / 24);
  return d === 1 ? "ayer" : `hace ${d} días`;
}

function toConversation(row: ConversationRow, messages: MessageRow[]): Conversation {
  const own = messages
    .filter((m) => m.conversation_id === row.id)
    .sort((a, b) => a.created_at.localeCompare(b.created_at));
  const last = own[own.length - 1];
  return {
    id: row.id,
    network: row.network as Conversation["network"],
    kind: row.kind as Conversation["kind"],
    person: row.person,
    handle: row.handle,
    avatarColor: row.avatar_color,
    lastAt: relativo(last?.created_at ?? row.updated_at),
    unread: row.unread,
    status: row.status as Conversation["status"],
    priority: row.priority as Priority,
    assignee: row.assignee,
    tags: row.tags ?? [],
    messages: own.map((m) => ({
      id: m.id,
      from: m.sender === "yo" ? "yo" : "cliente",
      text: m.body,
      at: hora(m.created_at),
    })),
  };
}

function toRule(row: RuleRow): PriorityRule {
  return {
    id: row.id,
    name: row.name,
    enabled: row.enabled,
    network: (row.network as PriorityRule["network"]) ?? null,
    keywords: row.keywords ?? [],
    senderKind: (row.sender_kind as SenderKind | null) ?? null,
    priority: row.priority as Priority,
    position: row.position,
  };
}

let conversations: Conversation[] = [];
let rules: PriorityRule[] = [];
let ready = false;
const listeners = new Set<() => void>();
const arrivalListeners = new Set<(c: Conversation) => void>();

function emit() {
  for (const l of listeners) l();
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function useConversations(): Conversation[] {
  return useSyncExternalStore(
    subscribe,
    () => conversations,
    () => conversations,
  );
}

export function useRules(): PriorityRule[] {
  return useSyncExternalStore(
    subscribe,
    () => rules,
    () => rules,
  );
}

export function useReady(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => ready,
    () => false,
  );
}

let focusId: string | null = null;
export function focusConversation(id: string | null) {
  focusId = id;
  emit();
}
export function useFocusId(): string | null {
  return useSyncExternalStore(
    subscribe,
    () => focusId,
    () => focusId,
  );
}

export function onNewMessage(cb: (c: Conversation) => void) {
  arrivalListeners.add(cb);
  return () => arrivalListeners.delete(cb);
}

export function sortByPriority(list: Conversation[]) {
  return [...list].sort((a, b) => {
    const p = priorityRank[a.priority] - priorityRank[b.priority];
    if (p !== 0) return p;
    if (a.unread !== b.unread) return a.unread ? -1 : 1;
    return Number(a.status === "resuelto") - Number(b.status === "resuelto");
  });
}

export async function refreshAll() {
  const [conv, msgs, rls] = await Promise.all([
    supabase.from("conversations").select("*").order("updated_at", { ascending: false }),
    supabase.from("messages").select("*").order("created_at", { ascending: true }),
    supabase.from("priority_rules").select("*").order("position", { ascending: true }),
  ]);
  if (conv.data && msgs.data) {
    conversations = (conv.data as ConversationRow[]).map((row) =>
      toConversation(row, msgs.data as MessageRow[]),
    );
  }
  if (rls.data) rules = (rls.data as RuleRow[]).map(toRule);
  ready = true;
  emit();
}

let started = false;
export function startSync() {
  if (started) return () => {};
  started = true;
  void refreshAll();

  const channel = supabase
    .channel("senal-sync")
    .on("postgres_changes", { event: "*", schema: "public", table: "conversations" }, () => {
      void refreshAll();
    })
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "messages" },
      async (payload) => {
        const row = payload.new as MessageRow;
        await refreshAll();
        if (row.sender !== "cliente") return;
        const conv = conversations.find((c) => c.id === row.conversation_id);
        if (conv) for (const l of arrivalListeners) l(conv);
      },
    )
    .on("postgres_changes", { event: "*", schema: "public", table: "priority_rules" }, () => {
      void refreshAll();
    })
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
    started = false;
  };
}

export async function updateConversation(id: string, patch: Partial<Conversation>) {
  conversations = conversations.map((c) => (c.id === id ? { ...c, ...patch } : c));
  emit();
  const row: Record<string, unknown> = {};
  if (patch.unread !== undefined) row['unread'] = patch.unread;
  if (patch.status !== undefined) row['status'] = patch.status;
  if (patch.priority !== undefined) row['priority'] = patch.priority;
  if (patch.assignee !== undefined) row['assignee'] = patch.assignee;
  if (patch.tags !== undefined) row['tags'] = patch.tags;
  if (Object.keys(row).length === 0) return;
  await supabase.from("conversations").update(row).eq("id", id);
}

export async function sendReply(conversationId: string, text: string) {
  await supabase.from("messages").insert({ conversation_id: conversationId, sender: "yo", body: text });
  await updateConversation(conversationId, { unread: false, status: "en_proceso" });
  await refreshAll();
}

export function priorityForIncoming(input: { network: Conversation["network"]; kind: SenderKind; text: string }) {
  return evaluatePriority(rules, input);
}

export async function receiveDemoMessage() {
  const sample = incomingSamples[Math.floor(Math.random() * incomingSamples.length)]!;
  const match = priorityForIncoming({
    network: sample.network,
    kind: sample.kind,
    text: sample.text,
  });
  const { data, error } = await supabase
    .from("conversations")
    .insert({
      network: sample.network,
      kind: sample.kind,
      person: sample.person,
      handle: sample.handle,
      avatar_color: `var(--net-${sample.network})`,
      unread: true,
      status: "pendiente",
      priority: match?.priority ?? sample.priority,
      tags: sample.tags,
    })
    .select("id")
    .single();
  if (error || !data) return null;
  await supabase.from("messages").insert({
    conversation_id: data.id,
    sender: "cliente",
    body: sample.text,
  });
  await refreshAll();
  return data.id as string;
}

export async function saveRule(rule: Omit<PriorityRule, "id"> & { id?: string }) {
  const row = {
    name: rule.name,
    enabled: rule.enabled,
    network: rule.network,
    keywords: rule.keywords,
    sender_kind: rule.senderKind,
    priority: rule.priority,
    position: rule.position,
  };
  if (rule.id) await supabase.from("priority_rules").update(row).eq("id", rule.id);
  else await supabase.from("priority_rules").insert(row);
  await refreshAll();
}

export async function deleteRule(id: string) {
  await supabase.from("priority_rules").delete().eq("id", id);
  await refreshAll();
}

export async function reclassifyAll() {
  let cambiados = 0;
  for (const c of conversations) {
    const text = c.messages
      .filter((m) => m.from === "cliente")
      .map((m) => m.text)
      .join(" ");
    const match = evaluatePriority(rules, { network: c.network, kind: c.kind, text });
    if (match && match.priority !== c.priority) {
      await updateConversation(c.id, { priority: match.priority });
      cambiados += 1;
    }
  }
  await refreshAll();
  return cambiados;
}
