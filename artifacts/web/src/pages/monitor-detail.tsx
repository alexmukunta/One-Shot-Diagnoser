import { useParams, useLocation, Link } from "wouter";
import { useState } from "react";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import {
  useGetMonitor, getGetMonitorQueryKey,
  useGetMonitorUptime, getGetMonitorUptimeQueryKey,
  useGetMonitorTimeseries, getGetMonitorTimeseriesQueryKey,
  useListMonitorChecks, getListMonitorChecksQueryKey,
  useListMonitorIncidents, getListMonitorIncidentsQueryKey,
  useTriggerMonitorCheck, usePauseMonitor, useResumeMonitor, useDeleteMonitor,
  useListMonitorAlertChannels, getListMonitorAlertChannelsQueryKey,
  useAddAlertChannelToMonitor, useRemoveAlertChannelFromMonitor,
  useListAlertChannels, getListAlertChannelsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/AppLayout";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Play, Pause, Trash2, RefreshCw, ExternalLink, Clock, Bell, BellOff, X, Plus, Mail, Webhook, MessageSquare } from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from "recharts";
import { format, formatDistanceToNow } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { UptimePercent } from "@/components/UptimeBars";

type Period = "24h" | "7d" | "30d";

export default function MonitorDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const qc = useQueryClient();
  const { toast } = useToast();
  const [period, setPeriod] = useState<Period>("24h");

  const { data: monitor, isLoading } = useGetMonitor(id!, {
    query: { enabled: !!id, queryKey: getGetMonitorQueryKey(id!) },
  });

  const { data: uptime } = useGetMonitorUptime(id!, { period }, {
    query: { enabled: !!id, queryKey: getGetMonitorUptimeQueryKey(id!, { period }) },
  });

  const { data: timeseries } = useGetMonitorTimeseries(id!, { period, granularity: period === "24h" ? "5m" : "1h" }, {
    query: { enabled: !!id, queryKey: getGetMonitorTimeseriesQueryKey(id!, { period }) },
  });

  const { data: checks } = useListMonitorChecks(id!, undefined, {
    query: { enabled: !!id, queryKey: getListMonitorChecksQueryKey(id!) },
  });

  const { data: incidents } = useListMonitorIncidents(id!, {
    query: { enabled: !!id, queryKey: getListMonitorIncidentsQueryKey(id!) },
  });

  const { data: assignedChannels } = useListMonitorAlertChannels(id!, {
    query: { enabled: !!id, queryKey: getListMonitorAlertChannelsQueryKey(id!) },
  });

  const { data: allChannels } = useListAlertChannels({
    query: { enabled: !!id, queryKey: getListAlertChannelsQueryKey() },
  });

  const [addChannelId, setAddChannelId] = useState<string>("");

  const invalidateMonitor = () => {
    qc.invalidateQueries({ queryKey: getGetMonitorQueryKey(id!) });
    qc.invalidateQueries({ queryKey: getListMonitorChecksQueryKey(id!) });
  };

  const invalidateChannels = () => {
    qc.invalidateQueries({ queryKey: getListMonitorAlertChannelsQueryKey(id!) });
  };

  const assignedIds = new Set(assignedChannels?.map((c) => c.id) ?? []);
  const unassignedChannels = allChannels?.filter((c) => !assignedIds.has(c.id)) ?? [];

  const triggerCheck = useTriggerMonitorCheck({
    mutation: { onSuccess: () => { toast({ title: "Check complete" }); invalidateMonitor(); } },
  });
  const pause = usePauseMonitor({
    mutation: { onSuccess: () => { toast({ title: "Monitor paused" }); invalidateMonitor(); } },
  });
  const resume = useResumeMonitor({
    mutation: { onSuccess: () => { toast({ title: "Monitor resumed" }); invalidateMonitor(); } },
  });
  const del = useDeleteMonitor({
    mutation: { onSuccess: () => { toast({ title: "Monitor deleted" }); setLocation("/monitors"); } },
  });
  const addChannel = useAddAlertChannelToMonitor({
    mutation: {
      onSuccess: () => {
        toast({ title: "Alert channel added" });
        setAddChannelId("");
        invalidateChannels();
      },
      onError: () => toast({ title: "Failed to add channel", variant: "destructive" }),
    },
  });
  const removeChannel = useRemoveAlertChannelFromMonitor({
    mutation: {
      onSuccess: () => { toast({ title: "Alert channel removed" }); invalidateChannels(); },
      onError: () => toast({ title: "Failed to remove channel", variant: "destructive" }),
    },
  });

  const chartData = timeseries?.series?.map((s) => ({
    time: format(new Date(s.timestamp), period === "24h" ? "HH:mm" : "MMM d"),
    ms: s.responseTimeMs,
  })) ?? [];

  return (
    <AppLayout>
      <div className="p-6 max-w-5xl mx-auto">
        <Link
          href="/monitors"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to monitors
        </Link>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-32 rounded-lg" />
          </div>
        ) : !monitor ? (
          <div className="text-center py-12 text-muted-foreground">Monitor not found</div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-xl font-semibold">{monitor.name}</h1>
                  <StatusBadge status={monitor.isActive ? (monitor.lastStatus ?? "unknown") : "paused"} size="sm" />
                </div>
                <a
                  href={monitor.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
                  data-testid="link-monitor-url"
                >
                  {monitor.url}
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => triggerCheck.mutate({ id: id! })}
                  disabled={triggerCheck.isPending}
                  data-testid="button-check-now"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${triggerCheck.isPending ? "animate-spin" : ""}`} />
                  Check now
                </Button>
                {monitor.isActive ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => pause.mutate({ id: id! })}
                    disabled={pause.isPending}
                    data-testid="button-pause"
                  >
                    <Pause className="w-4 h-4 mr-2" />
                    Pause
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => resume.mutate({ id: id! })}
                    disabled={resume.isPending}
                    data-testid="button-resume"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Resume
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30"
                  data-testid="button-delete"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Period selector */}
            <div className="flex items-center gap-3 mb-4">
              <div className="flex rounded-md border border-border overflow-hidden text-xs">
                {(["24h", "7d", "30d"] as Period[]).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPeriod(p)}
                    className={`px-3 py-1.5 transition-colors ${period === p ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground hover:bg-accent"}`}
                    data-testid={`button-period-${p}`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Uptime stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              {[
                { label: "Uptime", value: uptime ? <UptimePercent value={uptime.uptimePercent} className="text-lg font-bold" /> : <Skeleton className="h-6 w-16" /> },
                { label: "Avg response", value: uptime?.avgResponseTimeMs ? <span className="text-lg font-bold font-mono">{Math.round(uptime.avgResponseTimeMs)}ms</span> : <span className="text-lg font-bold text-muted-foreground">—</span> },
                { label: "P95 response", value: uptime?.p95ResponseTimeMs ? <span className="text-lg font-bold font-mono">{uptime.p95ResponseTimeMs}ms</span> : <span className="text-lg font-bold text-muted-foreground">—</span> },
                { label: "Incidents", value: <span className="text-lg font-bold">{uptime?.incidentsCount ?? 0}</span> },
              ].map(({ label, value }) => (
                <div key={label} className="bg-card border border-card-border rounded-lg p-4">
                  {value}
                  <div className="text-xs text-muted-foreground mt-1 uppercase tracking-wide">{label}</div>
                </div>
              ))}
            </div>

            {/* Response time chart */}
            <div className="bg-card border border-card-border rounded-lg p-4 mb-6">
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-4">Response time</div>
              {chartData.length === 0 ? (
                <div className="h-40 flex items-center justify-center text-sm text-muted-foreground">No data for this period</div>
              ) : (
                <ResponsiveContainer width="100%" height={160}>
                  <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(199,89%,48%)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(199,89%,48%)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="time" tick={{ fontSize: 10, fill: "hsl(215,15%,50%)" }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: "hsl(215,15%,50%)" }} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{ background: "hsl(222,40%,8%)", border: "1px solid hsl(222,30%,14%)", borderRadius: 6, fontSize: 12 }}
                      formatter={(v: number) => [`${v}ms`, "Response time"]}
                    />
                    <Area
                      type="monotone"
                      dataKey="ms"
                      stroke="hsl(199,89%,48%)"
                      strokeWidth={1.5}
                      fill="url(#grad)"
                      connectNulls
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Tabs */}
            <Tabs defaultValue="checks">
              <TabsList className="mb-4">
                <TabsTrigger value="checks" data-testid="tab-checks">Recent checks</TabsTrigger>
                <TabsTrigger value="incidents" data-testid="tab-incidents">Incidents</TabsTrigger>
                <TabsTrigger value="settings" data-testid="tab-settings">Settings</TabsTrigger>
              </TabsList>

              <TabsContent value="checks">
                <div className="bg-card border border-card-border rounded-lg overflow-hidden">
                  {!checks?.length ? (
                    <div className="p-8 text-center text-sm text-muted-foreground">No checks yet. Click "Check now" to run a manual check.</div>
                  ) : (
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">Status</th>
                          <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground uppercase tracking-wide hidden sm:table-cell">HTTP</th>
                          <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground uppercase tracking-wide hidden sm:table-cell">Response</th>
                          <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">Time</th>
                        </tr>
                      </thead>
                      <tbody>
                        {checks?.map((c) => (
                          <tr key={c.id} className="border-b border-border last:border-0">
                            <td className="px-4 py-2.5">
                              <StatusBadge status={c.status === "up" ? "up" : "down"} size="xs" />
                            </td>
                            <td className="px-4 py-2.5 hidden sm:table-cell">
                              <span className="font-mono text-xs text-muted-foreground">{c.httpStatus ?? "—"}</span>
                            </td>
                            <td className="px-4 py-2.5 text-right hidden sm:table-cell">
                              <span className="font-mono text-xs">{c.responseTimeMs != null ? `${c.responseTimeMs}ms` : "—"}</span>
                            </td>
                            <td className="px-4 py-2.5 text-right">
                              <div className="flex items-center justify-end gap-1 text-xs text-muted-foreground">
                                <Clock className="w-3 h-3" />
                                {formatDistanceToNow(new Date(c.checkedAt), { addSuffix: true })}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="incidents">
                <div className="bg-card border border-card-border rounded-lg overflow-hidden">
                  {!incidents?.length ? (
                    <div className="p-8 text-center text-sm text-green-400">No incidents for this monitor</div>
                  ) : (
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">Started</th>
                          <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground uppercase tracking-wide hidden sm:table-cell">Duration</th>
                          <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {incidents?.map((inc) => (
                          <tr key={inc.id} className="border-b border-border last:border-0 hover:bg-accent/30 transition-colors">
                            <td className="px-4 py-2.5">
                              <Link
                                href={`/incidents/${inc.id}`}
                                data-testid={`incident-link-${inc.id}`}
                                className="block hover:text-primary transition-colors"
                              >
                                <div className="text-xs font-medium">{format(new Date(inc.startedAt), "MMM d, HH:mm")}</div>
                                {inc.rootCause && <div className="text-xs text-muted-foreground truncate max-w-xs">{inc.rootCause}</div>}
                              </Link>
                            </td>
                            <td className="px-4 py-2.5 hidden sm:table-cell">
                              <span className="text-xs font-mono text-muted-foreground">
                                {inc.durationSeconds != null ? `${Math.round(inc.durationSeconds / 60)}m` : "Ongoing"}
                              </span>
                            </td>
                            <td className="px-4 py-2.5">
                              {inc.resolvedAt
                                ? <span className="text-xs text-green-400">Resolved</span>
                                : <span className="text-xs text-red-400">Active</span>
                              }
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="settings">
                <div className="space-y-5">
                  {/* Monitor config */}
                  <div className="bg-card border border-card-border rounded-lg divide-y divide-border">
                    <div className="px-4 py-3 flex items-center justify-between">
                      <span className="text-sm font-medium">Configuration</span>
                      <Link href={`/monitors/${id}/edit`}>
                        <Button size="sm" variant="outline" className="h-7 text-xs gap-1.5">
                          Edit settings
                        </Button>
                      </Link>
                    </div>
                    {[
                      ["Method", monitor?.method],
                      ["Interval", `${monitor?.intervalSeconds}s`],
                      ["Timeout", monitor?.timeoutSeconds != null ? `${monitor?.timeoutSeconds}s` : "—"],
                      ["Expected status", monitor?.expectedStatus?.toString() ?? "—"],
                      ["Keyword assertion", monitor?.keywordAssert ?? "—"],
                      ["Notify on down", monitor?.notifyOnDown ? "Yes" : "No"],
                      ["Notify on recovery", monitor?.notifyOnRecovery ? "Yes" : "No"],
                      ["Created", monitor?.createdAt ? format(new Date(monitor.createdAt), "PPP") : "—"],
                    ].map(([k, v]) => (
                      <div key={k} className="flex items-center justify-between px-4 py-3 text-sm">
                        <span className="text-muted-foreground">{k}</span>
                        <span className="font-mono text-xs">{v}</span>
                      </div>
                    ))}
                  </div>

                  {/* Alert channels */}
                  <div className="bg-card border border-card-border rounded-lg">
                    <div className="px-4 py-3 border-b border-border flex items-center gap-2">
                      <Bell className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Alert channels</span>
                    </div>

                    {/* Assigned channels */}
                    {!assignedChannels ? (
                      <div className="px-4 py-3 space-y-2">
                        <Skeleton className="h-8 w-full" />
                        <Skeleton className="h-8 w-3/4" />
                      </div>
                    ) : assignedChannels.length === 0 ? (
                      <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                        <BellOff className="w-5 h-5 mx-auto mb-2 opacity-40" />
                        No alert channels assigned — this monitor won't send notifications.
                      </div>
                    ) : (
                      <ul className="divide-y divide-border">
                        {assignedChannels?.map((ch) => {
                          const Icon = ch.type === "email" ? Mail : ch.type === "discord" || ch.type === "slack" ? MessageSquare : Webhook;
                          return (
                            <li key={ch.id} className="flex items-center justify-between px-4 py-2.5">
                              <div className="flex items-center gap-2.5 text-sm">
                                <Icon className="w-4 h-4 text-muted-foreground" />
                                <span>{ch.name}</span>
                                <span className="text-xs text-muted-foreground capitalize">{ch.type}</span>
                              </div>
                              <button
                                onClick={() => removeChannel.mutate({ id: id!, channelId: ch.id })}
                                disabled={removeChannel.isPending}
                                className="text-muted-foreground hover:text-destructive transition-colors p-1 rounded"
                                aria-label="Remove channel"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    )}

                    {/* Add channel */}
                    {unassignedChannels?.length > 0 && (
                      <div className="px-4 py-3 border-t border-border flex items-center gap-2">
                        <Select value={addChannelId} onValueChange={setAddChannelId}>
                          <SelectTrigger className="h-8 text-xs flex-1" data-testid="select-add-channel">
                            <SelectValue placeholder="Add a channel…" />
                          </SelectTrigger>
                          <SelectContent>
                            {unassignedChannels?.map((ch) => (
                              <SelectItem key={ch.id} value={ch.id} className="text-xs">
                                {ch.name} <span className="text-muted-foreground capitalize ml-1">({ch.type})</span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 gap-1.5 text-xs"
                          disabled={!addChannelId || addChannel.isPending}
                          onClick={() => {
                            if (addChannelId) {
                              addChannel.mutate({ id: id!, data: { alertChannelId: addChannelId } });
                            }
                          }}
                          data-testid="button-add-channel"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Add
                        </Button>
                      </div>
                    )}

                    {unassignedChannels.length === 0 && assignedChannels && assignedChannels.length > 0 && allChannels && allChannels.length > 0 && (
                      <div className="px-4 py-3 border-t border-border text-xs text-muted-foreground">
                        All your alert channels are already assigned.
                      </div>
                    )}

                    {allChannels?.length === 0 && (
                      <div className="px-4 py-3 border-t border-border text-xs text-muted-foreground">
                        <Link href="/alert-channels" className="text-primary hover:underline">Create an alert channel</Link> to receive notifications.
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>

      <ConfirmDialog
        open={showDeleteConfirm}
        title="Delete monitor?"
        description="This will permanently delete the monitor, all its check history, and all associated incidents. This action cannot be undone."
        confirmLabel="Delete monitor"
        onConfirm={() => del.mutate({ id: id! })}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </AppLayout>
  );
}
