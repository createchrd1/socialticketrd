import { priorityLabels, type Priority } from "@/lib/demo-data";

const classes: Record<Priority, string> = {
  alta: "border-destructive/50 bg-destructive/15 text-destructive",
  media: "border-warning/40 bg-warning/10 text-warning",
  baja: "border-border bg-secondary text-muted-foreground",
};

export function PriorityBadge({ priority, className = "" }: { priority: Priority; className?: string }) {
  return (
    <span
      className={`rounded-full border px-1.5 py-0.5 text-[10px] font-medium ${classes[priority]} ${className}`}
    >
      {priorityLabels[priority]}
    </span>
  );
}
