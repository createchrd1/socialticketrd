import { useSyncExternalStore } from "react";

import { conversations as seed, type Conversation } from "@/lib/demo-data";

let state: Conversation[] = seed;
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

export function updateConversation(id: string, patch: Partial<Conversation>) {
  state = state.map((c) => (c.id === id ? { ...c, ...patch } : c));
  emit();
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
