import type { Network, Priority } from "@/lib/demo-data";

export type SenderKind = "mensaje" | "comentario" | "mencion";

export type PriorityRule = {
  id: string;
  name: string;
  enabled: boolean;
  network: Network | null;
  keywords: string[];
  senderKind: SenderKind | null;
  priority: Priority;
  position: number;
};

export type RuleInput = {
  network: Network;
  kind: SenderKind;
  text: string;
};

const normalize = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

export function ruleMatches(rule: PriorityRule, input: RuleInput) {
  if (!rule.enabled) return false;
  if (rule.network && rule.network !== input.network) return false;
  if (rule.senderKind && rule.senderKind !== input.kind) return false;
  if (rule.keywords.length > 0) {
    const text = normalize(input.text);
    if (!rule.keywords.some((k) => k.trim() !== "" && text.includes(normalize(k)))) return false;
  }
  if (!rule.network && !rule.senderKind && rule.keywords.length === 0) return false;
  return true;
}

/** Devuelve la prioridad de la primera regla activa que coincide, o null. */
export function evaluatePriority(rules: PriorityRule[], input: RuleInput) {
  const ordered = [...rules].sort((a, b) => a.position - b.position);
  const hit = ordered.find((r) => ruleMatches(r, input));
  return hit ? { priority: hit.priority, rule: hit } : null;
}
