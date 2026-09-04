import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Trash2, Wand2 } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { PriorityBadge } from "@/components/PriorityBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { deleteRule, reclassifyAll, saveRule, useRules } from "@/lib/conversations-store";
import { networkLabels, priorityLabels, type Network, type Priority } from "@/lib/demo-data";
import type { PriorityRule, SenderKind } from "@/lib/priority-rules";

export const Route = createFileRoute("/reglas")({
  head: () => ({
    meta: [
      { title: "Reglas de prioridad — Señal" },
      {
        name: "description",
        content:
          "Crea reglas que clasifican automáticamente los mensajes por prioridad según el canal, las palabras clave o el tipo de remitente.",
      },
      { property: "og:title", content: "Reglas de prioridad — Señal" },
      {
        property: "og:description",
        content: "Clasifica solo los mensajes urgentes con reglas por canal, palabras y tipo de mensaje.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Reglas,
});

const redes: Network[] = ["instagram", "facebook", "x", "tiktok"];
const tipos: SenderKind[] = ["mensaje", "comentario", "mencion"];
const tipoLabels: Record<SenderKind, string> = {
  mensaje: "Mensaje directo",
  comentario: "Comentario",
  mencion: "Mención",
};

function Reglas() {
  const rules = useRules();
  const [guardando, setGuardando] = useState(false);

  const nueva = async () => {
    setGuardando(true);
    await saveRule({
      name: "Nueva regla",
      enabled: true,
      network: null,
      keywords: [],
      senderKind: "mensaje",
      priority: "alta",
      position: rules.length + 1,
    });
    setGuardando(false);
  };

  const actualizar = async (rule: PriorityRule, patch: Partial<PriorityRule>) => {
    await saveRule({ ...rule, ...patch });
  };

  const reclasificar = async () => {
    setGuardando(true);
    const n = await reclassifyAll();
    setGuardando(false);
    toast.success(
      n === 0 ? "Todo ya estaba bien clasificado." : `Se actualizó la prioridad de ${n} conversaciones.`,
    );
  };

  return (
    <AppShell>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Reglas de prioridad</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Se aplican de arriba hacia abajo: gana la primera regla que coincide con el mensaje.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => void reclasificar()} disabled={guardando}>
            <Wand2 className="mr-1.5 h-3.5 w-3.5" />
            Reclasificar conversaciones
          </Button>
          <Button size="sm" onClick={() => void nueva()} disabled={guardando}>
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Nueva regla
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        {rules.length === 0 && (
          <p className="panel p-8 text-center text-sm text-muted-foreground">
            Todavía no hay reglas. Crea la primera para clasificar los mensajes solos.
          </p>
        )}
        {rules.map((rule) => (
          <article key={rule.id} className="panel space-y-3 p-4">
            <div className="flex flex-wrap items-center gap-3">
              <Input
                value={rule.name}
                onChange={(e) => void actualizar(rule, { name: e.target.value })}
                className="w-64 bg-surface-2 font-medium"
              />
              <PriorityBadge priority={rule.priority} />
              <div className="ml-auto flex items-center gap-3">
                <label className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Switch
                    checked={rule.enabled}
                    onCheckedChange={(v) => void actualizar(rule, { enabled: v })}
                  />
                  {rule.enabled ? "Activa" : "Pausada"}
                </label>
                <Button variant="ghost" size="sm" onClick={() => void deleteRule(rule.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-4">
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">Canal</label>
                <Select
                  value={rule.network ?? "todos"}
                  onValueChange={(v) =>
                    void actualizar(rule, { network: v === "todos" ? null : (v as Network) })
                  }
                >
                  <SelectTrigger className="bg-surface-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos los canales</SelectItem>
                    {redes.map((n) => (
                      <SelectItem key={n} value={n}>
                        {networkLabels[n]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="mb-1 block text-xs text-muted-foreground">Tipo de remitente</label>
                <Select
                  value={rule.senderKind ?? "todos"}
                  onValueChange={(v) =>
                    void actualizar(rule, { senderKind: v === "todos" ? null : (v as SenderKind) })
                  }
                >
                  <SelectTrigger className="bg-surface-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Cualquiera</SelectItem>
                    {tipos.map((t) => (
                      <SelectItem key={t} value={t}>
                        {tipoLabels[t]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="md:col-span-1">
                <label className="mb-1 block text-xs text-muted-foreground">Prioridad que asigna</label>
                <Select
                  value={rule.priority}
                  onValueChange={(v) => void actualizar(rule, { priority: v as Priority })}
                >
                  <SelectTrigger className="bg-surface-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(["alta", "media", "baja"] as const).map((p) => (
                      <SelectItem key={p} value={p}>
                        {priorityLabels[p]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="mb-1 block text-xs text-muted-foreground">Orden</label>
                <Input
                  type="number"
                  value={rule.position}
                  onChange={(e) => void actualizar(rule, { position: Number(e.target.value) })}
                  className="bg-surface-2"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs text-muted-foreground">
                Palabras clave (separadas por comas; deja vacío para no filtrar por texto)
              </label>
              <Input
                defaultValue={rule.keywords.join(", ")}
                onBlur={(e) =>
                  void actualizar(rule, {
                    keywords: e.target.value
                      .split(",")
                      .map((k) => k.trim())
                      .filter(Boolean),
                  })
                }
                placeholder="queja, reclamo, no llega"
                className="bg-surface-2"
              />
            </div>
          </article>
        ))}
      </div>
    </AppShell>
  );
}
