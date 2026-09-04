import { createFileRoute } from "@tanstack/react-router";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { MessageSquare, Timer, Users, TrendingUp } from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { conversations, followerTrend, weeklyVolume } from "@/lib/demo-data";

export const Route = createFileRoute("/panel")({
  head: () => ({
    meta: [
      { title: "Panel de redes sociales — Señal" },
      {
        name: "description",
        content:
          "Estadísticas de tus redes: volumen de mensajes por día y red, crecimiento de seguidores y tiempo medio de respuesta.",
      },
      { property: "og:title", content: "Panel de redes sociales — Señal" },
      {
        property: "og:description",
        content: "Volumen de mensajes, crecimiento de seguidores y tiempo de respuesta en un vistazo.",
      },
    ],
  }),
  component: Panel,
});

const cards = [
  { label: "Mensajes esta semana", value: "612", delta: "+18% vs. semana pasada", icon: MessageSquare },
  { label: "Tiempo medio de respuesta", value: "24 min", delta: "-9 min vs. semana pasada", icon: Timer },
  { label: "Seguidores totales", value: "15.310", delta: "+690 nuevos", icon: Users },
  { label: "Tasa de respuesta", value: "94%", delta: "+3 puntos", icon: TrendingUp },
];

function Panel() {
  const pendientes = conversations.filter((c) => c.status === "pendiente").length;

  return (
    <AppShell>
      <h1 className="text-2xl font-semibold">Panel de actividad</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Resumen de los últimos 7 días · {pendientes} conversaciones pendientes.
      </p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ label, value, delta, icon: Icon }) => (
          <div key={label} className="panel p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{label}</span>
              <Icon className="h-4 w-4 text-primary" />
            </div>
            <p className="mt-3 font-sans text-3xl font-semibold">{value}</p>
            <p className="mt-1 text-xs text-accent">{delta}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="panel p-4">
          <h2 className="text-sm font-semibold">Mensajes por red y día</h2>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyVolume}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="day" stroke="var(--muted-foreground)" fontSize={12} />
                <YAxis stroke="var(--muted-foreground)" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    background: "var(--popover)",
                    border: "1px solid var(--border)",
                    borderRadius: "12px",
                    color: "var(--popover-foreground)",
                  }}
                />
                <Bar dataKey="instagram" stackId="a" fill="var(--net-instagram)" />
                <Bar dataKey="facebook" stackId="a" fill="var(--net-facebook)" />
                <Bar dataKey="x" stackId="a" fill="var(--net-x)" />
                <Bar dataKey="tiktok" stackId="a" fill="var(--net-tiktok)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="panel p-4">
          <h2 className="text-sm font-semibold">Crecimiento de seguidores</h2>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={followerTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="week" stroke="var(--muted-foreground)" fontSize={12} />
                <YAxis stroke="var(--muted-foreground)" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    background: "var(--popover)",
                    border: "1px solid var(--border)",
                    borderRadius: "12px",
                    color: "var(--popover-foreground)",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="seguidores"
                  stroke="var(--primary)"
                  strokeWidth={3}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
