import { Link } from "wouter";
import { useGetDashboard, getGetDashboardQueryKey } from "@workspace/api-client-react";
import { AppLayout } from "@/components/AppLayout";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, ExternalLink, Clock, TrendingUp, Activity, ArrowRight, Zap } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { UptimePercent } from "@/components/UptimeBars";

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bg-card border border-card-border rounded-lg p-4">
      <div className="text-2xl font-bold mb-1" style={{ color }}>{value}</div>
      <div className="text-xs text-muted-foreground uppercase tracking-wide">{label}</div>
    </div>
  );
}

function OnboardingWelcome() {
  return (
    <div className="bg-card border border-card-border rounded-xl p-8 text-center max-w-xl mx-auto">
      <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-5">
        <Activity className="w-7 h-7 text-primary" />
      </div>
      <h2 className="text-lg font-semibold mb-2">Welcome to URL Diagnostics</h2>
      <p className="text-sm text-muted-foreground mb-6 max-w-xs mx-auto leading-relaxed">
        Add your first monitor and we'll start checking it every minute — alerting you the moment something breaks.
      </p>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <Link href="/monitors/new">
          <Button className="gap-2 w-full sm:w-auto" data-testid="button-first-monitor">
            <Plus className="w-4 h-4" />
            Add your first monitor
          </Button>
        </Link>
        <Link href="/diagnose" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors">
          <Zap className="w-4 h-4" />
          Or run a quick URL check
        </Link>
      </div>
      <div className="mt-8 grid grid-cols-3 gap-4 text-center border-t border-border pt-6">
        {[
          { n: "1", label: "Add a URL to monitor" },
          { n: "2", label: "We check it every 60s" },
          { n: "3", label: "Get alerted if it's down" },
        ].map(({ n, label }) => (
          <div key={n}>
            <div className="w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center mx-auto mb-2">{n}</div>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { data, isLoading } = useGetDashboard({
    query: { queryKey: getGetDashboardQueryKey() },
  });

  const isEmpty = !isLoading && (data?.summary.total ?? 0) === 0;

  return (
    <AppLayout>
      <div className="p-6 max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-semibold text-foreground">Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Overview of all monitors</p>
          </div>
          {!isEmpty && (
            <Link href="/monitors/new">
              <Button size="sm" className="gap-2" data-testid="button-add-monitor">
                <Plus className="w-4 h-4" />
                Add monitor
              </Button>
            </Link>
          )}
        </div>

        {/* Onboarding — shown only when there are no monitors */}
        {isEmpty && (
          <div className="py-8">
            <OnboardingWelcome />
          </div>
        )}

        {/* Summary stats — hidden during onboarding */}
        {!isEmpty && (
          <>
            {isLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20 rounded-lg" />)}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                <StatCard label="Total" value={data?.summary.total ?? 0} color="hsl(215,20%,90%)" />
                <StatCard label="Up" value={data?.summary.up ?? 0} color="#22C55E" />
                <StatCard label="Down" value={data?.summary.down ?? 0} color="#EF4444" />
                <StatCard label="Degraded" value={data?.summary.degraded ?? 0} color="#F59E0B" />
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Monitor list */}
              <div className="lg:col-span-2">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-medium text-foreground">Monitors</h2>
                  <Link href="/monitors" className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
                    View all <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
                <div className="space-y-2">
                  {isLoading
                    ? [...Array(5)].map((_, i) => <Skeleton key={i} className="h-14 rounded-lg" />)
                    : data?.monitors.slice(0, 8).map((m) => (
                      <Link
                        key={m.id}
                        href={`/monitors/${m.id}`}
                        data-testid={`monitor-row-${m.id}`}
                        className="flex items-center gap-3 bg-card border border-card-border rounded-lg px-4 py-3 hover:border-border transition-colors group"
                      >
                        <StatusBadge status={m.status} size="xs" />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-foreground truncate">{m.name}</div>
                          <div className="text-xs text-muted-foreground truncate flex items-center gap-1">
                            {m.url}
                            <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-50" />
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0 hidden sm:block">
                          <div className="text-xs font-mono text-muted-foreground">
                            {m.lastResponseTimeMs != null ? `${m.lastResponseTimeMs}ms` : "—"}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            <UptimePercent value={m.uptime24h} />
                          </div>
                        </div>
                      </Link>
                    ))
                  }
                </div>
              </div>

              {/* Recent incidents */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-medium text-foreground">Recent Incidents</h2>
                  <Link href="/incidents" className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
                    View all <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
                <div className="space-y-2">
                  {isLoading
                    ? [...Array(4)].map((_, i) => <Skeleton key={i} className="h-16 rounded-lg" />)
                    : !data?.recentIncidents?.length
                    ? (
                      <div className="bg-card border border-card-border rounded-lg p-6 text-center">
                        <div className="text-green-500 text-sm font-medium mb-1">All clear</div>
                        <div className="text-xs text-muted-foreground">No recent incidents</div>
                      </div>
                    )
                    : data.recentIncidents.map((inc) => (
                      <Link
                        key={inc.id}
                        href={`/incidents/${inc.id}`}
                        data-testid={`incident-row-${inc.id}`}
                        className="block bg-card border border-card-border rounded-lg px-3 py-2.5 hover:border-border transition-colors"
                      >
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="text-xs font-medium text-foreground truncate">{inc.monitorName}</span>
                          {inc.resolvedAt
                            ? <span className="text-xs text-green-500 flex-shrink-0">Resolved</span>
                            : <span className="text-xs text-red-500 flex-shrink-0">Active</span>
                          }
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          {formatDistanceToNow(new Date(inc.startedAt), { addSuffix: true })}
                          {inc.durationSeconds != null && (
                            <span className="ml-1 flex items-center gap-1">
                              <TrendingUp className="w-3 h-3" />
                              {Math.round(inc.durationSeconds / 60)}m
                            </span>
                          )}
                        </div>
                      </Link>
                    ))
                  }
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}
