import { useState } from "react";
import { Link } from "wouter";
import { useListMonitors, getListMonitorsQueryKey, usePauseMonitor, useResumeMonitor, useDeleteMonitor } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/AppLayout";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Plus, Pause, Play, Trash2, ExternalLink, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useToast } from "@/hooks/use-toast";

export default function MonitorsPage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const { data, isLoading } = useListMonitors(undefined, {
    query: { queryKey: getListMonitorsQueryKey() },
  });
  const monitorList = Array.isArray(data) ? data : [];

  const invalidate = () => qc.invalidateQueries({ queryKey: getListMonitorsQueryKey() });

  const pause = usePauseMonitor({
    mutation: { onSuccess: () => { toast({ title: "Monitor paused" }); invalidate(); } },
  });
  const resume = useResumeMonitor({
    mutation: { onSuccess: () => { toast({ title: "Monitor resumed" }); invalidate(); } },
  });
  const del = useDeleteMonitor({
    mutation: {
      onSuccess: () => { toast({ title: "Monitor deleted" }); invalidate(); setDeleteTarget(null); },
    },
  });

  return (
    <AppLayout>
      <div className="p-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-semibold">Monitors</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {Array.isArray(data) ? `${data.length} monitor${data.length !== 1 ? "s" : ""}` : ""}
            </p>
          </div>
          <Link href="/monitors/new">
            <Button size="sm" className="gap-2" data-testid="button-add-monitor">
              <Plus className="w-4 h-4" />
              Add monitor
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 rounded-lg" />)}
          </div>
        ) : monitorList.length === 0 ? (
          <div className="bg-card border border-card-border rounded-lg p-12 text-center">
            <div className="text-base font-medium mb-2">No monitors yet</div>
            <p className="text-sm text-muted-foreground mb-6">Add your first monitor to start tracking uptime</p>
            <Link href="/monitors/new">
              <Button data-testid="button-first-monitor">
                <Plus className="w-4 h-4 mr-2" />
                Add monitor
              </Button>
            </Link>
          </div>
        ) : (
          <div className="bg-card border border-card-border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">Monitor</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground uppercase tracking-wide hidden sm:table-cell">Status</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground uppercase tracking-wide hidden md:table-cell">Last check</th>
                  <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody>
                {monitorList.map((m) => (
                  <tr key={m.id} className="border-b border-border last:border-0 hover:bg-accent/30 transition-colors">
                    <td className="px-4 py-3">
                      <Link
                        href={`/monitors/${m.id}`}
                        data-testid={`monitor-link-${m.id}`}
                        className="group block"
                      >
                        <div className="font-medium text-foreground group-hover:text-primary transition-colors">{m.name}</div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          {m.url}
                          <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-50" />
                        </div>
                      </Link>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <StatusBadge status={m.isActive ? (m.lastStatus ?? "unknown") : "paused"} />
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {m.lastCheckedAt ? formatDistanceToNow(new Date(m.lastCheckedAt), { addSuffix: true }) : "Never"}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {m.isActive ? (
                          <button
                            data-testid={`button-pause-${m.id}`}
                            onClick={(e) => { e.preventDefault(); pause.mutate({ id: m.id }); }}
                            className="p-1.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                            title="Pause"
                          >
                            <Pause className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <button
                            data-testid={`button-resume-${m.id}`}
                            onClick={(e) => { e.preventDefault(); resume.mutate({ id: m.id }); }}
                            className="p-1.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                            title="Resume"
                          >
                            <Play className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          data-testid={`button-delete-${m.id}`}
                          onClick={(e) => { e.preventDefault(); setDeleteTarget(m.id); }}
                          className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete monitor?"
        description="This will permanently delete the monitor and all its check history and incidents. This action cannot be undone."
        confirmLabel="Delete monitor"
        onConfirm={() => { if (deleteTarget) del.mutate({ id: deleteTarget }); }}
        onCancel={() => setDeleteTarget(null)}
      />
    </AppLayout>
  );
}
