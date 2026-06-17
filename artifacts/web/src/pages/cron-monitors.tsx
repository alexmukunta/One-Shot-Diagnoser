import { useState } from "react";
import {
  useListCronMonitors,
  useCreateCronMonitor,
  useDeleteCronMonitor,
  getListCronMonitorsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useToast } from "@/hooks/use-toast";
import {
  Plus, Trash2, Timer, CheckCircle2, XCircle, Clock, Copy,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

const APP_BASE = window.location.origin;

interface CronMonitor {
  id: string;
  name: string;
  slug: string;
  schedule: string | null;
  expectedIntervalSeconds: number;
  gracePeriodSeconds: number;
  status: "up" | "down" | "pending";
  lastPingAt: string | null;
  isActive: boolean;
  notifyOnDown: boolean;
  createdAt: string;
}

const INTERVAL_PRESETS = [
  { label: "Every minute",   seconds: 60 },
  { label: "Every 5 min",    seconds: 300 },
  { label: "Every 10 min",   seconds: 600 },
  { label: "Every 30 min",   seconds: 1800 },
  { label: "Every hour",     seconds: 3600 },
  { label: "Every 6 hours",  seconds: 21600 },
  { label: "Every 12 hours", seconds: 43200 },
  { label: "Every day",      seconds: 86400 },
];

function formatInterval(seconds: number): string {
  if (seconds < 60)   return `${seconds}s`;
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.round(seconds / 3600)}h`;
  return `${Math.round(seconds / 86400)}d`;
}

function StatusDot({ status }: { status: CronMonitor["status"] }) {
  if (status === "up")
    return <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />;
  if (status === "down")
    return <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />;
  return <Clock className="w-4 h-4 text-muted-foreground flex-shrink-0" />;
}

function StatusPill({ status }: { status: CronMonitor["status"] }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full",
        status === "up"      && "bg-green-500/10 text-green-400",
        status === "down"    && "bg-red-500/10 text-red-400",
        status === "pending" && "bg-muted text-muted-foreground",
      )}
    >
      <StatusDot status={status} />
      {status === "up" ? "Healthy" : status === "down" ? "Missed" : "Waiting"}
    </span>
  );
}

function PingUrlBox({ slug }: { slug: string }) {
  const { toast } = useToast();
  const url = `${APP_BASE}/api/cron/${slug}/ping`;
  return (
    <div className="flex items-center gap-1.5 mt-1 min-w-0">
      <code className="text-xs font-mono text-muted-foreground truncate flex-1 min-w-0">
        {url}
      </code>
      <button
        onClick={() => {
          navigator.clipboard.writeText(url);
          toast({ title: "Ping URL copied" });
        }}
        className="flex-shrink-0 p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
        title="Copy ping URL"
      >
        <Copy className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

interface FormState {
  name: string;
  schedule: string;
  expectedIntervalSeconds: number;
  gracePeriodSeconds: number;
}

const DEFAULT_FORM: FormState = {
  name: "",
  schedule: "",
  expectedIntervalSeconds: 3600,
  gracePeriodSeconds: 300,
};

export default function CronMonitorsPage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const { data: monitors, isLoading } = useListCronMonitors({
    query: { queryKey: getListCronMonitorsQueryKey() },
  });

  const invalidate = () =>
    qc.invalidateQueries({ queryKey: getListCronMonitorsQueryKey() });

  const create = useCreateCronMonitor({
    mutation: {
      onSuccess: () => {
        toast({ title: "Cron monitor created" });
        invalidate();
        setOpen(false);
        setForm(DEFAULT_FORM);
      },
      onError: () =>
        toast({ title: "Failed to create cron monitor", variant: "destructive" }),
    },
  });

  const del = useDeleteCronMonitor({
    mutation: {
      onSuccess: () => {
        toast({ title: "Cron monitor deleted" });
        invalidate();
        setDeleteTarget(null);
      },
    },
  });

  const monitorList = Array.isArray(monitors) ? monitors : [];

  return (
    <AppLayout>
      <div className="p-6 max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-semibold">Cron Monitors</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Get alerted when scheduled jobs stop reporting in
            </p>
          </div>
          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setForm(DEFAULT_FORM); }}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2">
                <Plus className="w-4 h-4" />
                Add monitor
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Add cron monitor</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div>
                  <Label>Name</Label>
                  <Input
                    className="mt-1.5"
                    placeholder="Daily DB backup"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  />
                </div>

                <div>
                  <Label>
                    Schedule{" "}
                    <span className="text-muted-foreground font-normal text-xs">
                      (optional — e.g. "0 * * * *")
                    </span>
                  </Label>
                  <Input
                    className="mt-1.5"
                    placeholder="0 0 * * *"
                    value={form.schedule}
                    onChange={(e) => setForm((f) => ({ ...f, schedule: e.target.value }))}
                  />
                </div>

                <div>
                  <Label>Expected interval</Label>
                  <Select
                    value={String(form.expectedIntervalSeconds)}
                    onValueChange={(v) =>
                      setForm((f) => ({ ...f, expectedIntervalSeconds: Number(v) }))
                    }
                  >
                    <SelectTrigger className="mt-1.5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {INTERVAL_PRESETS.map((p) => (
                        <SelectItem key={p.seconds} value={String(p.seconds)}>
                          {p.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1.5">
                    How often your cron job should send a ping
                  </p>
                </div>

                <div>
                  <Label>Grace period</Label>
                  <Select
                    value={String(form.gracePeriodSeconds)}
                    onValueChange={(v) =>
                      setForm((f) => ({ ...f, gracePeriodSeconds: Number(v) }))
                    }
                  >
                    <SelectTrigger className="mt-1.5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="60">1 minute</SelectItem>
                      <SelectItem value="300">5 minutes</SelectItem>
                      <SelectItem value="600">10 minutes</SelectItem>
                      <SelectItem value="1800">30 minutes</SelectItem>
                      <SelectItem value="3600">1 hour</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1.5">
                    Extra time before marking a job as missed
                  </p>
                </div>

                <Button
                  onClick={() =>
                    create.mutate({
                      data: {
                        name: form.name,
                        schedule: form.schedule || undefined,
                        expectedIntervalSeconds: form.expectedIntervalSeconds,
                        gracePeriodSeconds: form.gracePeriodSeconds,
                      },
                    })
                  }
                  disabled={create.isPending || !form.name.trim()}
                  className="w-full"
                >
                  {create.isPending ? "Creating..." : "Create monitor"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* How it works banner */}
        <div className="bg-primary/5 border border-primary/15 rounded-lg px-4 py-3 mb-5 flex items-start gap-3">
          <Timer className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground leading-relaxed">
            Add a{" "}
            <code className="font-mono text-foreground bg-muted px-1 py-0.5 rounded">
              curl -fsS -o /dev/null
            </code>{" "}
            call to your cron job that hits the ping URL below. If the job stops
            reporting in within the expected interval + grace period, you'll get
            an alert.
          </p>
        </div>

        {/* List */}
        {isLoading ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-lg" />
            ))}
          </div>
        ) : monitorList.length === 0 ? (
          <div className="bg-card border border-card-border rounded-lg p-12 text-center">
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
              <Timer className="w-5 h-5 text-muted-foreground" />
            </div>
            <div className="text-sm font-medium mb-1">No cron monitors yet</div>
            <p className="text-xs text-muted-foreground max-w-xs mx-auto">
              Add a cron monitor and paste its ping URL into your scheduled job to
              detect missed executions.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {monitorList.map((m) => (
              <div
                key={m.id}
                className="bg-card border border-card-border rounded-lg px-4 py-3"
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Timer className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium">{m.name}</span>
                      <StatusPill status={m.status} />
                      {m.schedule && (
                        <code className="text-xs font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                          {m.schedule}
                        </code>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                      <span>
                        Every{" "}
                        <span className="text-foreground font-medium">
                          {formatInterval(m.expectedIntervalSeconds)}
                        </span>
                      </span>
                      <span className="opacity-40">·</span>
                      <span>
                        Grace{" "}
                        <span className="text-foreground font-medium">
                          {formatInterval(m.gracePeriodSeconds)}
                        </span>
                      </span>
                      {m.lastPingAt ? (
                        <>
                          <span className="opacity-40">·</span>
                          <span>
                            Last ping{" "}
                            <span className="text-foreground font-medium">
                              {formatDistanceToNow(new Date(m.lastPingAt), {
                                addSuffix: true,
                              })}
                            </span>
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="opacity-40">·</span>
                          <span className="italic">Awaiting first ping</span>
                        </>
                      )}
                    </div>
                    <PingUrlBox slug={m.slug} />
                  </div>
                  <button
                    onClick={() => setDeleteTarget(m.id)}
                    className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors flex-shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete cron monitor?"
        description="This will permanently remove the monitor. Your cron job's ping URL will stop working."
        confirmLabel="Delete monitor"
        onConfirm={() => {
          if (deleteTarget) del.mutate({ id: deleteTarget });
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </AppLayout>
  );
}
