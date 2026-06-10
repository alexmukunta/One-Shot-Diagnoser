import { cn } from "@/lib/utils";

type BarStatus = "up" | "down" | "degraded" | "nodata";

interface Bar {
  date: string;
  status: BarStatus;
  uptime: number;
}

const BAR_COLOR: Record<BarStatus, string> = {
  up: "bg-green-500",
  down: "bg-red-500",
  degraded: "bg-amber-500",
  nodata: "bg-[hsl(222,30%,16%)]",
};

export function UptimeBars({ bars, className }: { bars: Bar[]; className?: string }) {
  return (
    <div className={cn("flex items-end gap-px", className)} data-testid="uptime-bars">
      {bars.map((bar, i) => (
        <div
          key={i}
          title={`${bar.date}: ${bar.status === "nodata" ? "No data" : `${bar.uptime.toFixed(1)}% uptime`}`}
          className={cn("flex-1 rounded-sm transition-opacity hover:opacity-80", BAR_COLOR[bar.status])}
          style={{ height: "24px" }}
          data-testid={`uptime-bar-${i}`}
        />
      ))}
    </div>
  );
}

export function UptimePercent({ value, className }: { value: number | null | undefined; className?: string }) {
  if (value == null) return <span className={cn("text-muted-foreground", className)}>—</span>;
  const color = value >= 99.9 ? "text-green-400" : value >= 99 ? "text-amber-400" : "text-red-400";
  return <span className={cn(color, className)}>{value.toFixed(2)}%</span>;
}
