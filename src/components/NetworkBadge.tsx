import { Facebook, Instagram, Music2, Hash } from "lucide-react";
import type { Network } from "@/lib/demo-data";
import { networkLabels } from "@/lib/demo-data";

const icons = {
  instagram: Instagram,
  facebook: Facebook,
  x: Hash,
  tiktok: Music2,
} as const;

const colorVar: Record<Network, string> = {
  instagram: "var(--net-instagram)",
  facebook: "var(--net-facebook)",
  x: "var(--net-x)",
  tiktok: "var(--net-tiktok)",
};

export function NetworkIcon({ network, className }: { network: Network; className?: string }) {
  const Icon = icons[network];
  return <Icon className={className} style={{ color: colorVar[network] }} />;
}

export function NetworkBadge({ network }: { network: Network }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium"
      style={{ borderColor: colorVar[network], color: colorVar[network] }}
    >
      <NetworkIcon network={network} className="h-3 w-3" />
      {networkLabels[network]}
    </span>
  );
}
