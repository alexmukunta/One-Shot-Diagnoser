import { useLocation, useParams, Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  useGetMonitor,
  getGetMonitorQueryKey,
  useUpdateMonitor,
  getListMonitorsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";
import { useEffect } from "react";

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  url: z.string().url("Must be a valid URL"),
  method: z.enum(["GET", "POST", "HEAD"]).default("GET"),
  intervalSeconds: z.coerce.number().min(60).max(86400).default(300),
  timeoutSeconds: z.coerce.number().min(5).max(60).default(30),
  expectedStatus: z.coerce.number().min(100).max(599).default(200),
  keywordAssert: z.string().optional(),
  notifyOnDown: z.boolean().default(true),
  notifyOnRecovery: z.boolean().default(true),
});

type FormValues = z.infer<typeof formSchema>;

export default function MonitorEditPage() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const qc = useQueryClient();
  const { toast } = useToast();

  const { data: monitor, isLoading } = useGetMonitor(id!, {
    query: { enabled: !!id, queryKey: getGetMonitorQueryKey(id!) },
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      url: "",
      method: "GET",
      intervalSeconds: 300,
      timeoutSeconds: 30,
      expectedStatus: 200,
      keywordAssert: "",
      notifyOnDown: true,
      notifyOnRecovery: true,
    },
  });

  useEffect(() => {
    if (!monitor) return;
    form.reset({
      name: monitor.name,
      url: monitor.url,
      method: (monitor.method as "GET" | "POST" | "HEAD") ?? "GET",
      intervalSeconds: monitor.intervalSeconds ?? 300,
      timeoutSeconds: monitor.timeoutSeconds ?? 30,
      expectedStatus: monitor.expectedStatus ?? 200,
      keywordAssert: monitor.keywordAssert ?? "",
      notifyOnDown: monitor.notifyOnDown ?? true,
      notifyOnRecovery: monitor.notifyOnRecovery ?? true,
    });
  }, [monitor, form]);

  const update = useUpdateMonitor({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getGetMonitorQueryKey(id!) });
        qc.invalidateQueries({ queryKey: getListMonitorsQueryKey() });
        toast({ title: "Monitor updated" });
        setLocation(`/monitors/${id}`);
      },
      onError: () => toast({ title: "Failed to update monitor", variant: "destructive" }),
    },
  });

  function onSubmit(values: FormValues) {
    update.mutate({
      id: id!,
      data: {
        name: values.name,
        url: values.url,
        method: values.method,
        intervalSeconds: values.intervalSeconds,
        timeoutSeconds: values.timeoutSeconds,
        expectedStatus: values.expectedStatus,
        keywordAssert: values.keywordAssert || undefined,
        notifyOnDown: values.notifyOnDown,
        notifyOnRecovery: values.notifyOnRecovery,
      },
    });
  }

  return (
    <AppLayout>
      <div className="p-6 max-w-2xl mx-auto">
        <Link
          href={`/monitors/${id}`}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to monitor
        </Link>
        <h1 className="text-xl font-semibold mb-6">Edit monitor</h1>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-10 rounded-lg" />
            <Skeleton className="h-10 rounded-lg" />
            <Skeleton className="h-32 rounded-lg" />
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="bg-card border border-card-border rounded-lg p-5 space-y-4">
                <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Target</h2>

                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Production API" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="url" render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://api.example.com/health" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="method" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Method</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="GET">GET</SelectItem>
                          <SelectItem value="POST">POST</SelectItem>
                          <SelectItem value="HEAD">HEAD</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="expectedStatus" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Expected status</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

                <FormField control={form.control} name="keywordAssert" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Keyword assertion <span className="text-muted-foreground font-normal">(optional)</span></FormLabel>
                    <FormControl>
                      <Input placeholder="ok" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <div className="bg-card border border-card-border rounded-lg p-5 space-y-4">
                <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Schedule</h2>

                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="intervalSeconds" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Interval</FormLabel>
                      <Select onValueChange={(v) => field.onChange(Number(v))} value={String(field.value)}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="60">Every minute</SelectItem>
                          <SelectItem value="300">Every 5 minutes</SelectItem>
                          <SelectItem value="600">Every 10 minutes</SelectItem>
                          <SelectItem value="900">Every 15 minutes</SelectItem>
                          <SelectItem value="1800">Every 30 minutes</SelectItem>
                          <SelectItem value="3600">Every hour</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="timeoutSeconds" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Timeout (seconds)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
              </div>

              <div className="bg-card border border-card-border rounded-lg p-5 space-y-4">
                <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Notifications</h2>

                <FormField control={form.control} name="notifyOnDown" render={({ field }) => (
                  <FormItem className="flex items-center justify-between">
                    <FormLabel className="cursor-pointer">Notify when down</FormLabel>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )} />

                <FormField control={form.control} name="notifyOnRecovery" render={({ field }) => (
                  <FormItem className="flex items-center justify-between">
                    <FormLabel className="cursor-pointer">Notify on recovery</FormLabel>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )} />
              </div>

              <div className="flex items-center justify-end gap-3">
                <Link href={`/monitors/${id}`}>
                  <Button type="button" variant="outline">Cancel</Button>
                </Link>
                <Button type="submit" disabled={update.isPending}>
                  {update.isPending ? "Saving..." : "Save changes"}
                </Button>
              </div>
            </form>
          </Form>
        )}
      </div>
    </AppLayout>
  );
}
