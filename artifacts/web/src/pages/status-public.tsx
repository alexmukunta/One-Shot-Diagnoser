import { useParams } from "wouter";
import { useGetPublicStatusPage, getGetPublicStatusPageQueryKey } from "@workspace/api-client-react";
import { StatusBadge } from "@/components/StatusBadge";
import { UptimeBars } from "@/components/UptimeBars";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle, AlertTriangle, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

export default function PublicStatusPage() {
  const { slug } = useParams<{ slug: string }>();

  const { data: page, isLoading, isError } = useGetPublicStatusPage(slug!, {
    query: { enabled: !!slug, queryKey: getGetPublicStatusPageQueryKey(slug!) },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-8 max-w-3xl mx-auto">
        <Skeleton className="h-8 w-64 mb-4" />
        <Skeleton className="h-4 w-48 mb-8" />
        {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16 rounded-lg mb-3" />)}
      </div>
    );
  }

  if (isError || !page) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-bold mb-2">Page not found</div>
          <p className="text-muted-foreground">This status page does not exist or is not public</p>
        </div>
      </div>
    );
  }

  const overallColor = page.overallStatus === "operational"
    ? "text-green-400"
    : page.overallStatus === "degraded"
    ? "text-amber-400"
    : "text-red-400";

  const overallIcon = page.overallStatus === "operational"
    ? CheckCircle
    : AlertTriangle;

  const OverallIcon = overallIcon;

  const isDemo = slug === "demo";

  return (
    <div className="min-h-screen bg-background">
      {isDemo && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 text-amber-400 text-xs text-center py-2 px-4">
          This is a demo status page with simulated data — not a real service.{" "}
          <a href="/sign-up" className="underline underline-offset-2 hover:text-amber-300 transition-colors">Create your own →</a>
        </div>
      )}
      {/* Header */}
      <div className="border-b border-border">
        <div className="max-w-3xl mx-auto px-6 py-8">
          <h1 className="text-2xl font-bold mb-1">{page.title}</h1>
          {page.description && (
            <p className="text-muted-foreground text-sm">{page.description}</p>
          )}
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8 space-y-8">
        {/* Overall status */}
        <div className={cn(
          "flex items-center gap-3 px-5 py-4 rounded-lg border",
          page.overallStatus === "operational"
            ? "bg-green-500/5 border-green-500/20"
            : page.overallStatus === "degraded"
            ? "bg-amber-500/5 border-amber-500/20"
            : "bg-red-500/5 border-red-500/20"
        )}>
          <OverallIcon className={cn("w-5 h-5", overallColor)} />
          <span className={cn("font-semibold capitalize", overallColor)}>
            {page.overallStatus === "operational" ? "All systems operational" : page.overallStatus}
          </span>
        </div>

        {/* Active incidents */}
        {page.activeIncidents && page.activeIncidents.length > 0 && (
          <div>
            <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground mb-3">Active Incidents</h2>
            <div className="space-y-2">
              {page.activeIncidents.map((inc) => (
                <div key={inc.id} className="bg-red-500/5 border border-red-500/20 rounded-lg p-4">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-sm font-medium text-red-400">{inc.monitorName}</span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDistanceToNow(new Date(inc.startedAt), { addSuffix: true })}
                    </span>
                  </div>
                  {inc.rootCause && (
                    <p className="text-xs text-muted-foreground">{inc.rootCause}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Monitors */}
        <div>
          <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground mb-3">Services</h2>
          <div className="space-y-3">
            {page.monitors.map((m, i) => (
              <div key={i} className="bg-card border border-card-border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium">{m.name}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground font-mono">
                      {m.uptime90d.toFixed(2)}% uptime
                    </span>
                    <StatusBadge status={m.status} size="xs" />
                  </div>
                </div>
                {m.dailyBars && m.dailyBars.length > 0 && (
                  <UptimeBars
                    bars={m.dailyBars.map((b) => ({ ...b, status: b.status as "up" | "down" | "degraded" | "nodata" }))}
                    className="h-6"
                  />
                )}
                <div className="flex justify-between text-xs text-muted-foreground mt-1.5">
                  <span>90 days ago</span>
                  <span>Today</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        Powered by URL Diagnostics
      </div>
    </div>
  );
}
