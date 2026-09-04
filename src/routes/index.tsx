import { createFileRoute } from "@tanstack/react-router";

import { AppShell } from "@/components/AppShell";
import { Inbox } from "@/components/Inbox";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Señal — Bandeja única de tus redes sociales" },
      {
        name: "description",
        content:
          "Lee y responde los mensajes y comentarios de Instagram, Facebook, X y TikTok desde una sola bandeja, con etiquetas, asignación y respuestas sugeridas por IA.",
      },
      { property: "og:title", content: "Señal — Bandeja única de tus redes sociales" },
      {
        property: "og:description",
        content:
          "Todos tus mensajes de Instagram, Facebook, X y TikTok en un solo lugar, listos para responder.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Bandeja,
});

function Bandeja() {
  return (
    <AppShell>
      <Inbox />
    </AppShell>
  );
}
