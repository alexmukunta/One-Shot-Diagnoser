import { useState } from "react";
import {
  useListAlertChannels, getListAlertChannelsQueryKey,
  useCreateAlertChannel, useDeleteAlertChannel, useTestAlertChannel,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Zap, Mail, MessageSquare, Webhook } from "lucide-react";
import { ConfirmDialog } from "@/components/ConfirmDialog";

type ChannelType = "email" | "slack" | "discord" | "webhook";

const TYPE_ICONS: Record<ChannelType, typeof Mail> = {
  email: Mail,
  slack: MessageSquare,
  discord: MessageSquare,
  webhook: Webhook,
};

function configSummary(type: string, config: unknown): string {
  if (!config || typeof config !== "object") return "";
  const c = config as Record<string, unknown>;
  if (type === "email" && typeof c.email === "string") return c.email;
  if ((type === "slack" || type === "discord") && typeof c.webhookUrl === "string") {
    try {
      const u = new URL(c.webhookUrl as string);
      return u.hostname + u.pathname.slice(0, 20) + (u.pathname.length > 20 ? "…" : "");
    } catch {
      return (c.webhookUrl as string).slice(0, 40);
    }
  }
  if (type === "webhook" && typeof c.url === "string") {
    try {
      const u = new URL(c.url as string);
      return u.hostname + u.pathname.slice(0, 20) + (u.pathname.length > 20 ? "…" : "");
    } catch {
      return (c.url as string).slice(0, 40);
    }
  }
  return "";
}

interface ChannelFormState {
  type: ChannelType;
  name: string;
  email: string;
  webhookUrl: string;
  url: string;
  secret: string;
}

const emptyForm = (): ChannelFormState => ({
  type: "email",
  name: "",
  email: "",
  webhookUrl: "",
  url: "",
  secret: "",
});

export default function AlertChannelsPage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<ChannelFormState>(emptyForm());

  const { data: channels, isLoading } = useListAlertChannels({
    query: { queryKey: getListAlertChannelsQueryKey() },
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: getListAlertChannelsQueryKey() });

  const create = useCreateAlertChannel({
    mutation: {
      onSuccess: () => {
        toast({ title: "Channel created" });
        invalidate();
        setOpen(false);
        setForm(emptyForm());
      },
      onError: () => toast({ title: "Failed to create channel", variant: "destructive" }),
    },
  });

  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const del = useDeleteAlertChannel({
    mutation: {
      onSuccess: () => { toast({ title: "Channel deleted" }); invalidate(); setDeleteTarget(null); },
    },
  });

  const test = useTestAlertChannel({
    mutation: {
      onSuccess: () => toast({ title: "Test notification sent" }),
      onError: () => toast({ title: "Test failed", variant: "destructive" }),
    },
  });

  function buildConfig(): Record<string, unknown> | null {
    switch (form.type) {
      case "email":
        if (!form.email.trim()) { toast({ title: "Email address is required", variant: "destructive" }); return null; }
        return { email: form.email.trim() };
      case "slack":
      case "discord":
        if (!form.webhookUrl.trim()) { toast({ title: "Webhook URL is required", variant: "destructive" }); return null; }
        return { webhookUrl: form.webhookUrl.trim() };
      case "webhook": {
        if (!form.url.trim()) { toast({ title: "URL is required", variant: "destructive" }); return null; }
        const cfg: Record<string, unknown> = { url: form.url.trim() };
        if (form.secret.trim()) cfg.secret = form.secret.trim();
        return cfg;
      }
    }
  }

  function handleCreate() {
    const config = buildConfig();
    if (!config) return;
    create.mutate({ data: { type: form.type, name: form.name, config } });
  }

  const set = (k: keyof ChannelFormState) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <AppLayout>
      <div className="p-6 max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-semibold">Alert Channels</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Where to send notifications when a monitor goes down</p>
          </div>
          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setForm(emptyForm()); }}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2" data-testid="button-add-channel">
                <Plus className="w-4 h-4" />
                Add channel
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Add alert channel</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div>
                  <Label>Type</Label>
                  <Select
                    value={form.type}
                    onValueChange={(v) => setForm({ ...emptyForm(), type: v as ChannelType, name: form.name })}
                  >
                    <SelectTrigger className="mt-1.5" data-testid="select-channel-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="slack">Slack</SelectItem>
                      <SelectItem value="discord">Discord</SelectItem>
                      <SelectItem value="webhook">Webhook</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Name</Label>
                  <Input
                    className="mt-1.5"
                    placeholder={
                      form.type === "email" ? "Team email" :
                      form.type === "slack" ? "Slack #alerts" :
                      form.type === "discord" ? "Discord #ops" :
                      "My webhook"
                    }
                    value={form.name}
                    onChange={set("name")}
                    data-testid="input-channel-name"
                  />
                </div>

                {form.type === "email" && (
                  <div>
                    <Label>Email address</Label>
                    <Input
                      className="mt-1.5"
                      type="email"
                      placeholder="alerts@example.com"
                      value={form.email}
                      onChange={set("email")}
                      data-testid="input-channel-email"
                    />
                  </div>
                )}

                {(form.type === "slack" || form.type === "discord") && (
                  <div>
                    <Label>Webhook URL</Label>
                    <Input
                      className="mt-1.5"
                      placeholder={
                        form.type === "slack"
                          ? "https://hooks.slack.com/services/..."
                          : "https://discord.com/api/webhooks/..."
                      }
                      value={form.webhookUrl}
                      onChange={set("webhookUrl")}
                      data-testid="input-channel-webhook-url"
                    />
                    <p className="text-xs text-muted-foreground mt-1.5">
                      {form.type === "slack"
                        ? "Create an incoming webhook in your Slack app settings."
                        : "Create a webhook in your Discord channel settings → Integrations."}
                    </p>
                  </div>
                )}

                {form.type === "webhook" && (
                  <>
                    <div>
                      <Label>URL</Label>
                      <Input
                        className="mt-1.5"
                        placeholder="https://yoursite.com/hooks/alert"
                        value={form.url}
                        onChange={set("url")}
                        data-testid="input-channel-url"
                      />
                    </div>
                    <div>
                      <Label>
                        Secret <span className="text-muted-foreground font-normal text-xs">(optional — sent as X-Webhook-Secret header)</span>
                      </Label>
                      <Input
                        className="mt-1.5"
                        placeholder="your-secret-token"
                        value={form.secret}
                        onChange={set("secret")}
                        data-testid="input-channel-secret"
                      />
                    </div>
                  </>
                )}

                <Button
                  onClick={handleCreate}
                  disabled={create.isPending || !form.name}
                  className="w-full"
                  data-testid="button-create-channel"
                >
                  {create.isPending ? "Creating..." : "Create channel"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16 rounded-lg" />)}
          </div>
        ) : !channels?.length ? (
          <div className="bg-card border border-card-border rounded-lg p-12 text-center">
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
              <Mail className="w-5 h-5 text-muted-foreground" />
            </div>
            <div className="text-sm font-medium mb-1">No alert channels yet</div>
            <p className="text-xs text-muted-foreground max-w-xs mx-auto">
              Add an email, Slack, Discord, or webhook channel to get notified when a monitor goes down.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {channels.map((ch) => {
              const Icon = TYPE_ICONS[ch.type as ChannelType] ?? Webhook;
              const summary = configSummary(ch.type, ch.config);
              return (
                <div
                  key={ch.id}
                  data-testid={`channel-row-${ch.id}`}
                  className="flex items-center gap-3 bg-card border border-card-border rounded-lg px-4 py-3"
                >
                  <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium">{ch.name}</div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <span className="capitalize">{ch.type}</span>
                      {summary && (
                        <>
                          <span className="opacity-40">·</span>
                          <span className="font-mono truncate">{summary}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      data-testid={`button-test-${ch.id}`}
                      onClick={() => test.mutate({ id: ch.id })}
                      disabled={test.isPending}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      Test
                    </button>
                    <button
                      data-testid={`button-delete-channel-${ch.id}`}
                      onClick={() => setDeleteTarget(ch.id)}
                      className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete alert channel?"
        description="This will permanently remove the channel. Any monitors assigned to it will no longer send alerts through this channel."
        confirmLabel="Delete channel"
        onConfirm={() => { if (deleteTarget) del.mutate({ id: deleteTarget }); }}
        onCancel={() => setDeleteTarget(null)}
      />
    </AppLayout>
  );
}
