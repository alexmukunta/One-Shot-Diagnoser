import { cn } from "@/lib/utils";

type Status = "up" | "down" | "degraded" | "paused" | "unknown" | "operational" | "outage";

const STATUS_CONFIG: Record<Status, { label: string; dot: string; text: string; bg: string }> = {
  up:          { label: "Up",          dot: "bg-green-500",  text: "text-green-400",  bg: "bg-green-500/10" },
  operational: { label: "Operational", dot: "bg-green-500",  text: "text-green-400",  bg: "bg-green-500/10" },
  down:        { label: "Down",        dot: "bg-red-500",    text: "text-red-400",    bg: "bg-red-500/10" },
  outage:      { label: "Outage",      dot: "bg-red-500",    text: "text-red-400",    bg: "bg-red-500/10" },
  degraded:    { label: "Degraded",    dot: "bg-amber-500",  text: "text-amber-400",  bg: "bg-amber-500/10" },
  paused:      { label: "Paused",      dot: "bg-gray-500",   text: "text-gray-400",   bg: "bg-gray-500/10" },
  unknown:     { label: "Unknown",     dot: "bg-gray-600",   text: "text-gray-500",   bg: "bg-gray-600/10" },
};

export function StatusBadge({ status, size = "sm" }: { status: string; size?: "xs" | "sm" | "md" }) {
  const cfg = STATUS_CONFIG[status as Status] ?? STATUS_CONFIG.unknown;
  return (
    <span
      data-testid={`status-badge-${status}`}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-medium",
        cfg.bg, cfg.text,
        size === "xs" && "px-1.5 py-0.5 text-xs",
        size === "sm" && "px-2 py-0.5 text-xs",
        size === "md" && "px-2.5 py-1 text-sm",
      )}
    >
      <span className={cn("rounded-full flex-shrink-0", cfg.dot, size === "xs" ? "w-1.5 h-1.5" : "w-2 h-2")} />
      {cfg.label}
    </span>
  );
}

export function StatusDot({ status, className }: { status: string; className?: string }) {
  const cfg = STATUS_CONFIG[status as Status] ?? STATUS_CONFIG.unknown;
  return <span className={cn("inline-block rounded-full", cfg.dot, className ?? "w-2 h-2")} />;
}
