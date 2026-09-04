import { useSyncExternalStore } from "react";

import { supabase } from "@/integrations/supabase/client";

export type AdPlatform = "google" | "facebook";

export type Campaign = {
  id: string;
  platform: AdPlatform;
  name: string;
  objective: string;
  status: "activa" | "pausada";
  dailyBudget: number;
  spend: number;
  impressions: number;
  clicks: number;
  results: number;
  revenue: number;
  startedOn: string;
};

export type DailyStat = {
  campaignId: string;
  day: string;
  spend: number;
  impressions: number;
  clicks: number;
  results: number;
  revenue: number;
};

export const platformLabels: Record<AdPlatform, string> = {
  google: "Google Ads",
  facebook: "Facebook Ads",
};

export const objectiveLabels: Record<string, string> = {
  ventas: "Ventas",
  mensajes: "Mensajes",
  trafico: "Tráfico",
  reconocimiento: "Reconocimiento",
};

export const money = (n: number) =>
  `Bs ${n.toLocaleString("es-BO", { maximumFractionDigits: 0 })}`;

export const numero = (n: number) => n.toLocaleString("es-BO", { maximumFractionDigits: 0 });

export type Alert = {
  id: string;
  campaign: Campaign;
  level: "grave" | "aviso" | "bueno";
  title: string;
  detail: string;
};

let campaigns: Campaign[] = [];
let daily: DailyStat[] = [];
let ready = false;
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}
function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function useCampaigns(): Campaign[] {
  return useSyncExternalStore(
    subscribe,
    () => campaigns,
    () => campaigns,
  );
}

export function useDailyStats(): DailyStat[] {
  return useSyncExternalStore(
    subscribe,
    () => daily,
    () => daily,
  );
}

export function useAdsReady(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => ready,
    () => false,
  );
}

export async function refreshAds() {
  const [c, d] = await Promise.all([
    supabase.from("ad_campaigns").select("*").order("platform").order("name"),
    supabase.from("ad_daily_stats").select("*").order("day"),
  ]);
  if (c.data) {
    campaigns = c.data.map((row) => ({
      id: row.id,
      platform: row.platform as AdPlatform,
      name: row.name,
      objective: row.objective,
      status: row.status as Campaign["status"],
      dailyBudget: Number(row.daily_budget),
      spend: Number(row.spend),
      impressions: row.impressions,
      clicks: row.clicks,
      results: row.results,
      revenue: Number(row.revenue),
      startedOn: row.started_on,
    }));
  }
  if (d.data) {
    daily = d.data.map((row) => ({
      campaignId: row.campaign_id,
      day: row.day,
      spend: Number(row.spend),
      impressions: row.impressions,
      clicks: row.clicks,
      results: row.results,
      revenue: Number(row.revenue),
    }));
  }
  ready = true;
  emit();
}

let started = false;
export function startAdsSync() {
  if (started) return () => {};
  started = true;
  void refreshAds();
  const channel = supabase
    .channel("senal-ads")
    .on("postgres_changes", { event: "*", schema: "public", table: "ad_campaigns" }, () => {
      void refreshAds();
    })
    .on("postgres_changes", { event: "*", schema: "public", table: "ad_daily_stats" }, () => {
      void refreshAds();
    })
    .subscribe();
  return () => {
    void supabase.removeChannel(channel);
    started = false;
  };
}

export async function setCampaignStatus(id: string, status: Campaign["status"]) {
  campaigns = campaigns.map((c) => (c.id === id ? { ...c, status } : c));
  emit();
  await supabase.from("ad_campaigns").update({ status }).eq("id", id);
  await refreshAds();
}

export function costPerResult(c: { spend: number; results: number }) {
  return c.results > 0 ? c.spend / c.results : 0;
}

export function roas(c: { spend: number; revenue: number }) {
  return c.spend > 0 ? c.revenue / c.spend : 0;
}

/** Compara los últimos 3 días con los 7 anteriores para detectar cambios bruscos. */
export function buildAlerts(list: Campaign[], stats: DailyStat[]): Alert[] {
  const alerts: Alert[] = [];
  const dias = [...new Set(stats.map((s) => s.day))].sort();
  const recientes = new Set(dias.slice(-3));
  const previos = new Set(dias.slice(-10, -3));

  for (const c of list) {
    const suyos = stats.filter((s) => s.campaignId === c.id);
    const sum = (set: Set<string>, key: "spend" | "results" | "revenue") =>
      suyos.filter((s) => set.has(s.day)).reduce((n, s) => n + s[key], 0);
    const diasRecientes = suyos.filter((s) => recientes.has(s.day)).length || 1;
    const diasPrevios = suyos.filter((s) => previos.has(s.day)).length || 1;

    const gastoDia = sum(recientes, "spend") / diasRecientes;
    const gastoDiaPrev = sum(previos, "spend") / diasPrevios;
    const resDia = sum(recientes, "results") / diasRecientes;
    const resDiaPrev = sum(previos, "results") / diasPrevios;
    const roasRec = sum(recientes, "spend") > 0 ? sum(recientes, "revenue") / sum(recientes, "spend") : 0;

    if (c.status === "activa" && gastoDia > c.dailyBudget * 1.05) {
      alerts.push({
        id: `${c.id}-presupuesto`,
        campaign: c,
        level: "grave",
        title: "Gasto por encima del presupuesto",
        detail: `Gasta ${money(gastoDia)} al día frente a un presupuesto de ${money(c.dailyBudget)}.`,
      });
    }
    if (gastoDiaPrev > 0 && gastoDia > gastoDiaPrev * 1.3) {
      alerts.push({
        id: `${c.id}-subida`,
        campaign: c,
        level: "aviso",
        title: "El gasto se disparó",
        detail: `Subió ${Math.round(((gastoDia - gastoDiaPrev) / gastoDiaPrev) * 100)}% en los últimos 3 días.`,
      });
    }
    if (resDiaPrev > 0 && resDia < resDiaPrev * 0.75) {
      alerts.push({
        id: `${c.id}-caida`,
        campaign: c,
        level: "grave",
        title: "Caen los resultados",
        detail: `Pasó de ${resDiaPrev.toFixed(1)} a ${resDia.toFixed(1)} resultados por día.`,
      });
    }
    if (roasRec >= 3) {
      alerts.push({
        id: `${c.id}-buena`,
        campaign: c,
        level: "bueno",
        title: "Rinde muy bien",
        detail: `Devuelve ${roasRec.toFixed(1)} Bs por cada Bs invertido en los últimos 3 días.`,
      });
    }
  }

  const orden = { grave: 0, aviso: 1, bueno: 2 } as const;
  return alerts.sort((a, b) => orden[a.level] - orden[b.level]);
}
