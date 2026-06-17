import { Link, useParams } from "wouter";
import { useGetPublicStatusPage, getGetPublicStatusPageQueryKey } from "@workspace/api-client-react";
import { StatusBadge } from "@/components/StatusBadge";
import { UptimeBars } from "@/components/UptimeBars";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle, AlertTriangle, Clock, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

export default function PublicStatusPage() {
  const { slug } = useParams<{ slug: string }>();

  const { data: page, isLoading, isError } = useGetPublicStatusPage(slug!, {
    query: { enabled: !!slug, queryKey: getGetPublicStatusPageQueryKey(slug!) },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (isError || !page) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Status Page Not Found</h1>
          <p className="text-muted-foreground mb-6 text-sm">This status page does not exist or has been made private.</p>
          <Link href="/" className="text-primary hover:underline text-sm font-medium">
            Go back home
          </Link>
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
    <div className="min-h-screen bg-background text-foreground flex flex-col relative overflow-hidden">
      {/* Background Wallpaper */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: "url('/landing-wallpaper.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          opacity: 0.4,
        }}
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 70% 80% at 50% 50%, transparent 20%, hsl(var(--background) / 0.85) 100%)",
        }}
      />

      <header className="relative z-10 border-b border-border/60 px-4 sm:px-6 h-14 flex items-center bg-background/95 backdrop-blur-sm sticky top-0 flex-shrink-0">
        <div className="max-w-3xl mx-auto w-full flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group transition-opacity hover:opacity-80">
            <div className="w-7 h-7 rounded overflow-hidden flex items-center justify-center flex-shrink-0">
              <img src="/status-icon.png" alt="Logo" className="w-full h-full object-contain" />
            </div>
            <span className="font-semibold text-sm tracking-tight truncate">One Shot Diagnoser</span>
          </Link>

          <Link href="/" className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors py-1 px-2 -mr-2">
            <X className="w-3.5 h-3.5" />
            Exit
          </Link>
        </div>
      </header>

      <main className="relative z-10 flex-1 w-full max-w-3xl mx-auto px-4 sm:px-6 py-12">
        {isDemo && (
          <div className="mb-8 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs text-center py-2.5 px-4 rounded-lg">
            This is a demo status page with simulated data — not a real service.{" "}
            <a href="/sign-up" className="underline underline-offset-2 hover:text-amber-300 transition-colors">Create your own →</a>
          </div>
        )}

        <div className="mb-10">
          <h1 className="text-3xl font-bold tracking-tight mb-2">{page.title}</h1>
          {page.description && (
            <p className="text-muted-foreground text-sm leading-relaxed max-w-xl">{page.description}</p>
          )}
        </div>

        <div className="space-y-10">
          {/* Overall status */}
          <div className={cn(
            "flex items-center gap-3 px-5 py-5 rounded-xl border-2 shadow-sm",
            page.overallStatus === "operational"
              ? "bg-green-500/5 border-green-500/20"
              : page.overallStatus === "degraded"
              ? "bg-amber-500/5 border-amber-500/20"
              : "bg-red-500/5 border-red-500/20"
          )}>
            <OverallIcon className={cn("w-6 h-6", overallColor)} />
            <span className={cn("text-lg font-bold capitalize", overallColor)}>
              {page.overallStatus === "operational" ? "All Systems Operational" : page.overallStatus}
            </span>
          </div>

          {/* Active incidents */}
          {page?.activeIncidents && page?.activeIncidents?.length > 0 && (
            <div>
              <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4 px-1">Active Incidents</h2>
              <div className="space-y-3">
                {page?.activeIncidents?.map((inc) => (
                  <div key={inc.id} className="bg-red-500/5 border border-red-500/20 rounded-xl p-5 shadow-sm">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <span className="font-bold text-red-400">{inc.monitorName}</span>
                      <span className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1.5 whitespace-nowrap">
                        <Clock className="w-3.5 h-3.5" />
                        {formatDistanceToNow(new Date(inc.startedAt), { addSuffix: true })}
                      </span>
                    </div>
                    {inc.rootCause && (
                      <p className="text-sm text-muted-foreground leading-relaxed">{inc.rootCause}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Monitors */}
          <div>
            <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4 px-1">Services</h2>
            <div className="space-y-4">
              {page?.monitors?.map((m, i) => (
                <div key={i} className="bg-card/50 backdrop-blur-sm border border-card-border rounded-xl p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-bold text-sm tracking-tight">{m.name}</span>
                    <div className="flex items-center gap-4">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                        {m.uptime90d.toFixed(2)}% uptime
                      </span>
                      <StatusBadge status={m.status} size="xs" />
                    </div>
                  </div>
                  {m?.dailyBars && m?.dailyBars?.length > 0 && (
                    <UptimeBars
                      bars={m?.dailyBars?.map((b) => ({ ...b, status: b.status as "up" | "down" | "degraded" | "nodata" }))}
                      className="h-8"
                    />
                  )}
                  <div className="flex justify-between text-[10px] font-bold uppercase tracking-tighter text-muted-foreground/50 mt-2 px-0.5">
                    <span>90 days ago</span>
                    <span>Today</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      <footer className="relative z-10 border-t border-border/60 py-10 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-5 h-5 rounded overflow-hidden flex items-center justify-center">
            <img src="/status-icon.png" alt="Logo" className="w-full h-full object-contain" />
          </div>
          <span className="text-xs font-bold tracking-tight">One Shot Diagnoser</span>
        </div>
        <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium">
          Powered by One Shot Diagnoser
        </p>
      </footer>
    </div>
  );
}
