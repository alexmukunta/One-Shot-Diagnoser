import { useState } from "react";
import { Link } from "wouter";
import {
  useListStatusPages, getListStatusPagesQueryKey,
  useCreateStatusPage, useDeleteStatusPage,
  useListMonitors, getListMonitorsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useUpdateStatusPage } from "@workspace/api-client-react";
import { Plus, Trash2, Pencil, ExternalLink, Globe } from "lucide-react";
import { ConfirmDialog } from "@/components/ConfirmDialog";

export default function StatusPagesPage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [slug, setSlug] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedMonitors, setSelectedMonitors] = useState<string[]>([]);

  const [editTarget, setEditTarget] = useState<{ id: string; title: string; description: string; monitorIds: string[] } | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editMonitors, setEditMonitors] = useState<string[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const { data: pagesData, isLoading } = useListStatusPages({
    query: { queryKey: getListStatusPagesQueryKey() },
  });
  const pageList = Array.isArray(pagesData) ? pagesData : [];

  const { data: monitorsData } = useListMonitors(undefined, {
    query: { queryKey: getListMonitorsQueryKey() },
  });
  const monitorList = Array.isArray(monitorsData) ? monitorsData : [];

  const invalidate = () => qc.invalidateQueries({ queryKey: getListStatusPagesQueryKey() });

  const create = useCreateStatusPage({
    mutation: {
      onSuccess: () => {
        toast({ title: "Status page created" });
        invalidate();
        setOpen(false);
        setSlug(""); setTitle(""); setDescription(""); setSelectedMonitors([]);
      },
      onError: () => toast({ title: "Failed to create status page", variant: "destructive" }),
    },
  });

  const del = useDeleteStatusPage({
    mutation: { onSuccess: () => { toast({ title: "Status page deleted" }); invalidate(); setDeleteTarget(null); } },
  });

  const update = useUpdateStatusPage({
    mutation: {
      onSuccess: () => {
        toast({ title: "Status page updated" });
        invalidate();
        setEditTarget(null);
      },
      onError: () => toast({ title: "Failed to update status page", variant: "destructive" }),
    },
  });

  const openEdit = (page: { id: string; title: string; description?: string | null; monitorIds?: unknown }) => {
    const ids = (page.monitorIds as string[] | undefined) ?? [];
    setEditTarget({ id: page.id, title: page.title, description: page.description ?? "", monitorIds: ids });
    setEditTitle(page.title);
    setEditDescription(page.description ?? "");
    setEditMonitors(ids);
  };

  const toggleEditMonitor = (id: string) => {
    setEditMonitors((prev) => prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]);
  };

  const toggleMonitor = (id: string) => {
    setSelectedMonitors((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );
  };

  return (
    <AppLayout>
      <div className="p-6 max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-semibold">Status Pages</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Public status pages for stakeholders</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2" data-testid="button-add-status-page">
                <Plus className="w-4 h-4" />
                Create page
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Create status page</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div>
                  <Label>Slug (URL path)</Label>
                  <Input
                    className="mt-1.5 font-mono"
                    placeholder="my-company"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))}
                    data-testid="input-slug"
                  />
                  {slug && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Will be accessible at <span className="font-mono text-primary">/status/{slug}</span>
                    </p>
                  )}
                </div>
                <div>
                  <Label>Title</Label>
                  <Input
                    className="mt-1.5"
                    placeholder="Acme Systems Status"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    data-testid="input-title"
                  />
                </div>
                <div>
                  <Label>Description <span className="text-muted-foreground font-normal">(optional)</span></Label>
                  <Input
                    className="mt-1.5"
                    placeholder="Real-time status for all Acme services"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    data-testid="input-description"
                  />
                </div>
                {monitorList && monitorList?.length > 0 && (
                  <div>
                    <Label>Monitors to display</Label>
                    <div className="mt-2 space-y-2 max-h-40 overflow-y-auto">
                      {monitorList?.map((m) => (
                        <div key={m.id} className="flex items-center gap-2">
                          <Checkbox
                            id={`monitor-${m.id}`}
                            checked={selectedMonitors.includes(m.id)}
                            onCheckedChange={() => toggleMonitor(m.id)}
                            data-testid={`checkbox-monitor-${m.id}`}
                          />
                          <label htmlFor={`monitor-${m.id}`} className="text-sm cursor-pointer">{m.name}</label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <Button
                  onClick={() => create.mutate({ data: { slug, title, description: description || undefined, monitorIds: selectedMonitors } })}
                  disabled={create.isPending || !slug || !title}
                  className="w-full"
                  data-testid="button-create-page"
                >
                  {create.isPending ? "Creating..." : "Create status page"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16 rounded-lg" />)}
          </div>
        ) : !pageList?.length ? (
          <div className="bg-card border border-card-border rounded-lg p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Globe className="w-6 h-6 text-primary" />
            </div>
            <div className="text-sm font-medium mb-1">No status pages</div>
            <p className="text-xs text-muted-foreground max-w-xs mx-auto">
              Create a public status page to keep your users informed about system status
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {pageList?.map((page) => (
              <div
                key={page.id}
                data-testid={`status-page-row-${page.id}`}
                className="flex items-center gap-3 bg-card border border-card-border rounded-lg px-4 py-3"
              >
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">{page.title}</div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                    <span className="font-mono">/status/{page.slug}</span>
                    <span className="text-muted-foreground/50">•</span>
                    <span>{(page.monitorIds as string[])?.length ?? 0} monitors</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <Link
                    href={`/status/${page.slug}`}
                    target="_blank"
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                    data-testid={`button-view-page-${page.id}`}
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    View
                  </Link>
                  <button
                    data-testid={`button-edit-page-${page.id}`}
                    onClick={() => openEdit(page)}
                    className="p-1.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                    title="Edit"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    data-testid={`button-delete-page-${page.id}`}
                    onClick={() => setDeleteTarget(page.id)}
                    className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ─── Edit dialog ─── */}
      <Dialog open={editTarget !== null} onOpenChange={(v) => { if (!v) setEditTarget(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit status page</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label>Title</Label>
              <Input
                className="mt-1.5"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                data-testid="input-edit-title"
              />
            </div>
            <div>
              <Label>Description <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <Input
                className="mt-1.5"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                data-testid="input-edit-description"
              />
            </div>
            {monitorList && monitorList?.length > 0 && (
              <div>
                <Label>Monitors to display</Label>
                <div className="mt-2 space-y-2 max-h-40 overflow-y-auto">
                  {monitorList?.map((m) => (
                    <div key={m.id} className="flex items-center gap-2">
                      <Checkbox
                        id={`edit-monitor-${m.id}`}
                        checked={editMonitors.includes(m.id)}
                        onCheckedChange={() => toggleEditMonitor(m.id)}
                      />
                      <label htmlFor={`edit-monitor-${m.id}`} className="text-sm cursor-pointer">{m.name}</label>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <Button
              onClick={() => editTarget && update.mutate({
                id: editTarget.id,
                data: { title: editTitle, description: editDescription || undefined, monitorIds: editMonitors },
              })}
              disabled={update.isPending || !editTitle}
              className="w-full"
              data-testid="button-save-edit"
            >
              {update.isPending ? "Saving..." : "Save changes"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete status page?"
        description="This will permanently remove the status page. Your monitors will not be affected."
        confirmLabel="Delete page"
        onConfirm={() => { if (deleteTarget) del.mutate({ id: deleteTarget }); }}
        onCancel={() => setDeleteTarget(null)}
      />
    </AppLayout>
  );
}
