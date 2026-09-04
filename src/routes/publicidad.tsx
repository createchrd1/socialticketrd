import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  AlertTriangle,
  CircleDollarSign,
  MessageSquare,
  MousePointerClick,
  Pause,
  Play,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { focusConversation, useConversations } from "@/lib/conversations-store";
import {
  buildAlerts,
  costPerResult,
  money,
  numero,
  objectiveLabels,
  platformLabels,
  roas,
  setCampaignStatus,
  startAdsSync,
  useAdsReady,
  useCampaigns,
  useDailyStats,
  type AdPlatform,
} from "@/lib/ads-store";

export const Route = createFileRoute("/publicidad")({
  head: () => ({
    meta: [
      { title: "Publicidad: Google Ads y Facebook Ads — Señal" },
      {
        name: "description",
        content:
          "Sigue el gasto, los clics, el costo por resultado y los mensajes que genera cada campaña de Google Ads y Facebook Ads en un solo lugar.",
      },
      { property: "og:title", content: "Publicidad: Google Ads y Facebook Ads — Señal" },
      {
        property: "og:description",
        content: "Compara Google y Facebook, revisa el retorno de cada campaña y responde los mensajes que traen.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Publicidad,
});

const platformColor: Record<AdPlatform, string> = {
  google: "oklch(0.72 0.11 195)",
  facebook: "oklch(0.79 0.16 68)",
};

const alertStyles = {
  grave: "border-destructive/40 bg-destructive/10 text-destructive",
  aviso: "border-primary/40 bg-primary/10 text-primary",
  bueno: "border-accent/40 bg-accent/10 text-accent",
} as const;

function Publicidad() {
  const navigate = useNavigate();
  const campaigns = useCampaigns();
  const daily = useDailyStats();
  const ready = useAdsReady();
  const conversations = useConversations();

  useEffect(() => startAdsSync(), []);

  const mensajesPorCampana = useMemo(() => {
    const map = new Map<string, number>();
    for (const c of conversations) {
      if (!c.campaignId) continue;
      map.set(c.campaignId, (map.get(c.campaignId) ?? 0) + 1);
    }
    return map;
  }, [conversations]);

  const totales = useMemo(() => {
    const acc = { spend: 0, clicks: 0, results: 0, revenue: 0, impressions: 0 };
    for (const c of campaigns) {
      acc.spend += c.spend;
      acc.clicks += c.clicks;
      acc.results += c.results;
      acc.revenue += c.revenue;
      acc.impressions += c.impressions;
    }
    return acc;
  }, [campaigns]);

  const serie = useMemo(() => {
    const byCampaign = new Map(campaigns.map((c) => [c.id, c.platform]));
    const dias = new Map<string, { day: string; google: number; facebook: number; gRes: number; fRes: number }>();
    for (const s of daily) {
      const p = byCampaign.get(s.campaignId);
      if (!p) continue;
      const etiqueta = new Date(`${s.day}T12:00:00`).toLocaleDateString("es-BO", {
        day: "2-digit",
        month: "short",
      });
      const item = dias.get(s.day) ?? { day: etiqueta, google: 0, facebook: 0, gRes: 0, fRes: 0 };
      if (p === "google") {
        item.google += s.spend;
        item.gRes += s.results;
      } else {
        item.facebook += s.spend;
        item.fRes += s.results;
      }
      dias.set(s.day, item);
    }
    return [...dias.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([, v]) => v);
  }, [daily, campaigns]);

  const alerts = useMemo(() => buildAlerts(campaigns, daily), [campaigns, daily]);

  const porPlataforma = (["google", "facebook"] as const).map((p) => {
    const list = campaigns.filter((c) => c.platform === p);
    const spend = list.reduce((n, c) => n + c.spend, 0);
    const revenue = list.reduce((n, c) => n + c.revenue, 0);
    const results = list.reduce((n, c) => n + c.results, 0);
    const mensajes = list.reduce((n, c) => n + (mensajesPorCampana.get(c.id) ?? 0), 0);
    return { platform: p, list, spend, revenue, results, mensajes };
  });

  const abrirMensajes = (campaignId: string) => {
    const conv = conversations.find((c) => c.campaignId === campaignId);
    if (!conv) return;
    focusConversation(conv.id);
    void navigate({ to: "/canal/$network", params: { network: conv.network } });
  };

  const tarjetas = [
    { label: "Inversión (14 días)", value: money(totales.spend), icon: CircleDollarSign },
    {
      label: "Costo por resultado",
      value: money(costPerResult(totales)),
      icon: Target,
    },
    { label: "Clics", value: numero(totales.clicks), icon: MousePointerClick },
    {
      label: "Retorno por Bs invertido",
      value: `${roas(totales).toFixed(2)}x`,
      icon: TrendingUp,
    },
  ];

  return (
    <AppShell>
      <div className="mb-5">
        <h1 className="text-2xl font-semibold">Publicidad</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Google Ads y Facebook Ads en un mismo tablero · últimos 14 días.
          {!ready && " Cargando cifras…"}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {tarjetas.map(({ label, value, icon: Icon }) => (
          <div key={label} className="panel p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{label}</span>
              <Icon className="h-4 w-4 text-primary" />
            </div>
            <p className="mt-3 font-sans text-3xl font-semibold">{value}</p>
          </div>
        ))}
      </div>

      {alerts.length > 0 && (
        <section className="mt-4">
          <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold">
            <AlertTriangle className="h-4 w-4 text-primary" />
            Avisos de rendimiento
          </h2>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {alerts.map((a) => (
              <article key={a.id} className={`rounded-xl border p-3 ${alertStyles[a.level]}`}>
                <div className="flex items-center gap-2 text-xs font-semibold">
                  {a.level === "bueno" ? (
                    <Sparkles className="h-3.5 w-3.5" />
                  ) : (
                    <AlertTriangle className="h-3.5 w-3.5" />
                  )}
                  {a.title}
                </div>
                <p className="mt-1 text-sm text-foreground">{a.detail}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {platformLabels[a.campaign.platform]} · {a.campaign.name}
                </p>
              </article>
            ))}
          </div>
        </section>
      )}

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="panel p-4">
          <h2 className="text-sm font-semibold">Inversión por día: Google vs. Facebook</h2>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={serie}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="day" stroke="var(--muted-foreground)" fontSize={12} />
                <YAxis stroke="var(--muted-foreground)" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    background: "var(--popover)",
                    border: "1px solid var(--border)",
                    borderRadius: 12,
                    color: "var(--popover-foreground)",
                  }}
                  formatter={(v: number) => money(v)}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="google" name="Google Ads" fill={platformColor.google} radius={[4, 4, 0, 0]} />
                <Bar dataKey="facebook" name="Facebook Ads" fill={platformColor.facebook} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="panel p-4">
          <h2 className="text-sm font-semibold">Resultados por día</h2>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={serie}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="day" stroke="var(--muted-foreground)" fontSize={12} />
                <YAxis stroke="var(--muted-foreground)" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    background: "var(--popover)",
                    border: "1px solid var(--border)",
                    borderRadius: 12,
                    color: "var(--popover-foreground)",
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line
                  type="monotone"
                  dataKey="gRes"
                  name="Google Ads"
                  stroke={platformColor.google}
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="fRes"
                  name="Facebook Ads"
                  stroke={platformColor.facebook}
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {porPlataforma.map(({ platform, list, spend, revenue, results, mensajes }) => (
        <section key={platform} className="mt-5">
          <header className="mb-2 flex flex-wrap items-baseline gap-3">
            <h2 className="text-sm font-semibold" style={{ color: platformColor[platform] }}>
              {platformLabels[platform]}
            </h2>
            <span className="text-xs text-muted-foreground">
              {money(spend)} invertidos · {numero(results)} resultados · {money(revenue)} en ventas ·{" "}
              {mensajes} conversaciones
            </span>
          </header>

          <div className="panel overflow-x-auto">
            <table className="w-full min-w-[820px] text-sm">
              <thead className="text-left text-xs text-muted-foreground">
                <tr className="border-b border-border">
                  <th className="p-3 font-medium">Campaña</th>
                  <th className="p-3 font-medium">Objetivo</th>
                  <th className="p-3 font-medium text-right">Gasto</th>
                  <th className="p-3 font-medium text-right">Clics</th>
                  <th className="p-3 font-medium text-right">Resultados</th>
                  <th className="p-3 font-medium text-right">Costo/result.</th>
                  <th className="p-3 font-medium text-right">Retorno</th>
                  <th className="p-3 font-medium text-right">Mensajes</th>
                  <th className="p-3" />
                </tr>
              </thead>
              <tbody>
                {list.map((c) => {
                  const msgs = mensajesPorCampana.get(c.id) ?? 0;
                  return (
                    <tr key={c.id} className="border-b border-border/60 last:border-0">
                      <td className="p-3">
                        <p className="font-medium">{c.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Presupuesto {money(c.dailyBudget)}/día ·{" "}
                          {c.status === "activa" ? "Activa" : "Pausada"}
                        </p>
                      </td>
                      <td className="p-3 text-xs text-muted-foreground">
                        {objectiveLabels[c.objective] ?? c.objective}
                      </td>
                      <td className="p-3 text-right">{money(c.spend)}</td>
                      <td className="p-3 text-right">{numero(c.clicks)}</td>
                      <td className="p-3 text-right">{numero(c.results)}</td>
                      <td className="p-3 text-right">{money(costPerResult(c))}</td>
                      <td
                        className="p-3 text-right font-medium"
                        style={{ color: roas(c) >= 2 ? "var(--accent)" : undefined }}
                      >
                        {roas(c).toFixed(2)}x
                      </td>
                      <td className="p-3 text-right">
                        {msgs > 0 ? (
                          <button
                            type="button"
                            onClick={() => abrirMensajes(c.id)}
                            className="inline-flex items-center gap-1 text-primary hover:underline"
                          >
                            <MessageSquare className="h-3.5 w-3.5" />
                            {msgs}
                          </button>
                        ) : (
                          <span className="text-muted-foreground">0</span>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            void setCampaignStatus(c.id, c.status === "activa" ? "pausada" : "activa")
                          }
                        >
                          {c.status === "activa" ? (
                            <Pause className="h-3.5 w-3.5" />
                          ) : (
                            <Play className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      ))}
    </AppShell>
  );
}
