import { Link, useParams } from "wouter";
import { useGetIncident, getGetIncidentQueryKey, useAcknowledgeIncident } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Clock, CheckCircle, AlertTriangle, ExternalLink } from "lucide-react";
import { format, formatDistanceToNow, formatDuration, intervalToDuration } from "date-fns";
import { useToast } from "@/hooks/use-toast";

export default function IncidentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const { toast } = useToast();

  const { data: incident, isLoading } = useGetIncident(id!, {
    query: { enabled: !!id, queryKey: getGetIncidentQueryKey(id!) },
  });

  const acknowledge = useAcknowledgeIncident({
    mutation: {
      onSuccess: () => {
        toast({ title: "Incident acknowledged" });
        qc.invalidateQueries({ queryKey: getGetIncidentQueryKey(id!) });
      },
    },
  });

  return (
    <AppLayout>
      <div className="p-6 max-w-3xl mx-auto">
        <Link
          href="/incidents"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to incidents
        </Link>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-32 rounded-lg" />
          </div>
        ) : !incident ? (
          <div className="text-center py-12 text-muted-foreground">Incident not found</div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-xl font-semibold mb-1">
                  {incident.monitorName ?? `Monitor #${incident.monitorId}`}
                </h1>
                <div className="flex items-center gap-2">
                  {incident.resolvedAt ? (
                    <span className="inline-flex items-center gap-1.5 text-sm text-green-400">
                      <CheckCircle className="w-4 h-4" /> Resolved
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-sm text-red-400">
                      <AlertTriangle className="w-4 h-4" /> Active
                    </span>
                  )}
                  {incident.isAcknowledged && (
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">Acknowledged</span>
                  )}
                </div>
              </div>
              {!incident.isAcknowledged && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => acknowledge.mutate({ id: incident.id })}
                  disabled={acknowledge.isPending}
                  data-testid="button-acknowledge"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Acknowledge
                </Button>
              )}
            </div>

            <div className="bg-card border border-card-border rounded-lg divide-y divide-border">
              <div className="grid grid-cols-2 sm:grid-cols-3 divide-x divide-border">
                <div className="p-4">
                  <div className="text-xs text-muted-foreground mb-1 uppercase tracking-wide">Started</div>
                  <div className="text-sm font-medium" title={format(new Date(incident.startedAt), "PPpp")}>
                    {formatDistanceToNow(new Date(incident.startedAt), { addSuffix: true })}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">{format(new Date(incident.startedAt), "MMM d, HH:mm")}</div>
                </div>
                <div className="p-4">
                  <div className="text-xs text-muted-foreground mb-1 uppercase tracking-wide">Resolved</div>
                  {incident.resolvedAt ? (
                    <>
                      <div className="text-sm font-medium">{formatDistanceToNow(new Date(incident.resolvedAt), { addSuffix: true })}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{format(new Date(incident.resolvedAt), "MMM d, HH:mm")}</div>
                    </>
                  ) : (
                    <div className="text-sm text-red-400 font-medium">Still active</div>
                  )}
                </div>
                <div className="p-4 col-span-2 sm:col-span-1">
                  <div className="text-xs text-muted-foreground mb-1 uppercase tracking-wide">Duration</div>
                  {incident.durationSeconds != null ? (
                    <div className="text-sm font-medium">
                      {formatDuration(intervalToDuration({ start: 0, end: incident.durationSeconds * 1000 }))}
                    </div>
                  ) : (
                    <div className="text-sm text-red-400 font-medium flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      Ongoing
                    </div>
                  )}
                </div>
              </div>

              {incident.rootCause && (
                <div className="p-4">
                  <div className="text-xs text-muted-foreground mb-1.5 uppercase tracking-wide">Root cause</div>
                  <div className="text-sm font-mono bg-background rounded px-3 py-2 border border-border text-red-400">
                    {incident.rootCause}
                  </div>
                </div>
              )}

              {incident.monitorUrl && (
                <div className="p-4">
                  <div className="text-xs text-muted-foreground mb-1.5 uppercase tracking-wide">Affected URL</div>
                  <a
                    href={incident.monitorUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline flex items-center gap-1"
                    data-testid="link-monitor-url"
                  >
                    {incident.monitorUrl}
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}

              {incident.affectedRegions && incident.affectedRegions.length > 0 && (
                <div className="p-4">
                  <div className="text-xs text-muted-foreground mb-1.5 uppercase tracking-wide">Affected regions</div>
                  <div className="flex flex-wrap gap-1.5">
                    {incident.affectedRegions.map((r) => (
                      <span key={r} className="text-xs bg-muted px-2 py-0.5 rounded font-mono">{r}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              <Link href={`/monitors/${incident.monitorId}`}>
                <Button variant="outline" size="sm" data-testid="link-view-monitor">
                  View monitor
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
