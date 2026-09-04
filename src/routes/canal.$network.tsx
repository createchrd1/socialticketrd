import { createFileRoute, notFound } from "@tanstack/react-router";

import { AppShell } from "@/components/AppShell";
import { Inbox } from "@/components/Inbox";
import { networkLabels, type Network } from "@/lib/demo-data";

const channels: Network[] = ["instagram", "facebook", "x", "tiktok"];

export const Route = createFileRoute("/canal/$network")({
  loader: ({ params }) => {
    if (!channels.includes(params.network as Network)) throw notFound();
    return { network: params.network as Network };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [{ title: "Canal no disponible — Señal" }, { name: "robots", content: "noindex" }],
      };
    }
    const label = networkLabels[loaderData.network];
    const title = `Canal ${label} — Señal`;
    const description = `Lee y responde todos los mensajes y comentarios de ${label} desde Señal, con etiquetas, asignación y respuestas sugeridas por IA.`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  notFoundComponent: CanalNoEncontrado,
  component: Canal,
});

function Canal() {
  const { network } = Route.useLoaderData();
  return (
    <AppShell>
      <Inbox channel={network} />
    </AppShell>
  );
}

function CanalNoEncontrado() {
  return (
    <AppShell>
      <div className="panel p-10 text-center">
        <h1 className="text-xl font-semibold">Ese canal no existe</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Elige Instagram, Facebook, X o TikTok en el menú superior.
        </p>
      </div>
    </AppShell>
  );
}
