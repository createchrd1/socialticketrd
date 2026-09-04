import { useSyncExternalStore } from "react";

import {
  conversations as seed,
  incomingSamples,
  priorityRank,
  type Conversation,
  type Message,
} from "@/lib/demo-data";

const STORAGE_KEY = "senal.conversaciones.v1";

let state: Conversation[] = seed;
let focusId: string | null = null;
const listeners = new Set<() => void>();
const arrivalListeners = new Set<(c: Conversation) => void>();

function emit() {
  for (const l of listeners) l();
}

function persist() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* almacenamiento no disponible */
  }
}

let loaded = false;
export function loadStoredConversations() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Conversation[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        state = parsed;
        emit();
      }
    }
  } catch {
    /* datos corruptos: se ignoran */
  }
}

function setState(next: Conversation[]) {
  state = next;
  persist();
  emit();
}

export function updateConversation(id: string, patch: Partial<Conversation>) {
  setState(state.map((c) => (c.id === id ? { ...c, ...patch } : c)));
}

export function appendMessage(id: string, message: Message) {
  setState(
    state.map((c) => (c.id === id ? { ...c, messages: [...c.messages, message], lastAt: "ahora" } : c)),
  );
}

export function sortByPriority(list: Conversation[]) {
  return [...list].sort((a, b) => {
    const p = priorityRank[a.priority] - priorityRank[b.priority];
    if (p !== 0) return p;
    if (a.unread !== b.unread) return a.unread ? -1 : 1;
    const resuelto = Number(a.status === "resuelto") - Number(b.status === "resuelto");
    return resuelto;
  });
}

export function useConversations(): Conversation[] {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => state,
    () => state,
  );
}

export function focusConversation(id: string | null) {
  focusId = id;
  emit();
}

export function useFocusId(): string | null {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => focusId,
    () => focusId,
  );
}

export function onNewMessage(cb: (c: Conversation) => void) {
  arrivalListeners.add(cb);
  return () => arrivalListeners.delete(cb);
}

export function receiveDemoMessage() {
  const sample = incomingSamples[Math.floor(Math.random() * incomingSamples.length)]!;
  const at = new Date().toLocaleTimeString("es-BO", { hour: "2-digit", minute: "2-digit" });
  const conversation: Conversation = {
    id: crypto.randomUUID(),
    network: sample.network,
    kind: sample.kind,
    person: sample.person,
    handle: sample.handle,
    avatarColor: `var(--net-${sample.network})`,
    lastAt: "ahora",
    unread: true,
    status: "pendiente",
    priority: sample.priority,
    assignee: null,
    tags: sample.tags,
    messages: [{ id: crypto.randomUUID(), from: "cliente", text: sample.text, at }],
  };
  setState([conversation, ...state]);
  for (const l of arrivalListeners) l(conversation);
  return conversation;
}

let timer: ReturnType<typeof setInterval> | null = null;
export function startDemoFeed() {
  if (timer !== null) return () => {};
  timer = setInterval(() => receiveDemoMessage(), 45000);
  return () => {
    if (timer !== null) clearInterval(timer);
    timer = null;
  };
}

export function resetConversations() {
  setState(seed);
}
