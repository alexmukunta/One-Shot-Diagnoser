import { Link } from "wouter";
import { useListIncidents, getListIncidentsQueryKey } from "@workspace/api-client-react";
import { AppLayout } from "@/components/AppLayout";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Clock, AlertTriangle } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";

export default function IncidentsPage() {
  const { data, isLoading } = useListIncidents(undefined, {
    query: { queryKey: getListIncidentsQueryKey() },
  });

  return (
    <AppLayout>
      <div className="p-6 max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-xl font-semibold">Incidents</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {data ? `${data.total} total incidents` : ""}
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-16 rounded-lg" />)}
          </div>
        ) : !data?.items.length ? (
          <div className="bg-card border border-card-border rounded-lg p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6 text-green-500" />
            </div>
            <div className="text-base font-medium text-green-400 mb-1">No incidents</div>
            <p className="text-sm text-muted-foreground">All your monitors are healthy</p>
          </div>
        ) : (
          <div className="bg-card border border-card-border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">Monitor</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground uppercase tracking-wide hidden sm:table-cell">Started</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground uppercase tracking-wide hidden md:table-cell">Duration</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">Status</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((inc) => (
                  <tr key={inc.id} className="border-b border-border last:border-0 hover:bg-accent/30 transition-colors">
                    <td className="px-4 py-3">
                      <Link
                        href={`/incidents/${inc.id}`}
                        data-testid={`incident-link-${inc.id}`}
                        className="block hover:text-primary transition-colors"
                      >
                        <div className="font-medium text-foreground">{inc.monitorName ?? `Monitor #${inc.monitorId}`}</div>
                        <div className="text-xs text-muted-foreground mt-0.5 truncate max-w-xs">{inc.rootCause}</div>
                      </Link>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span title={format(new Date(inc.startedAt), "PPpp")}>
                          {formatDistanceToNow(new Date(inc.startedAt), { addSuffix: true })}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-xs font-mono text-muted-foreground">
                        {inc.durationSeconds != null
                          ? inc.durationSeconds < 3600
                            ? `${Math.round(inc.durationSeconds / 60)}m`
                            : `${(inc.durationSeconds / 3600).toFixed(1)}h`
                          : "Ongoing"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {inc.resolvedAt
                          ? <Badge variant="outline" className="text-xs text-green-400 border-green-500/30 bg-green-500/5">Resolved</Badge>
                          : <Badge variant="outline" className="text-xs text-red-400 border-red-500/30 bg-red-500/5">Active</Badge>
                        }
                        {inc.isAcknowledged && (
                          <Badge variant="outline" className="text-xs text-muted-foreground">Acked</Badge>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
