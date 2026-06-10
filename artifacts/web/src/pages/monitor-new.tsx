import { useLocation, Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCreateMonitor, getListMonitorsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";

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

export default function MonitorNewPage() {
  const [, setLocation] = useLocation();
  const qc = useQueryClient();
  const { toast } = useToast();

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

  const create = useCreateMonitor({
    mutation: {
      onSuccess: (monitor) => {
        qc.invalidateQueries({ queryKey: getListMonitorsQueryKey() });
        toast({ title: "Monitor created" });
        setLocation(`/monitors/${monitor.id}`);
      },
      onError: () => toast({ title: "Failed to create monitor", variant: "destructive" }),
    },
  });

  function onSubmit(values: FormValues) {
    create.mutate({
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
          href="/monitors"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to monitors
        </Link>
        <h1 className="text-xl font-semibold mb-6">Add monitor</h1>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="bg-card border border-card-border rounded-lg p-5 space-y-4">
              <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Target</h2>

              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Production API" data-testid="input-name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="url" render={({ field }) => (
                <FormItem>
                  <FormLabel>URL</FormLabel>
                  <FormControl>
                    <Input placeholder="https://api.example.com/health" data-testid="input-url" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="method" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Method</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-method">
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
                      <Input type="number" data-testid="input-expected-status" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <FormField control={form.control} name="keywordAssert" render={({ field }) => (
                <FormItem>
                  <FormLabel>Keyword assertion <span className="text-muted-foreground font-normal">(optional)</span></FormLabel>
                  <FormControl>
                    <Input placeholder="ok" data-testid="input-keyword" {...field} />
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
                    <Select onValueChange={(v) => field.onChange(Number(v))} defaultValue={String(field.value)}>
                      <FormControl>
                        <SelectTrigger data-testid="select-interval">
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
                      <Input type="number" data-testid="input-timeout" {...field} />
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
                    <Switch data-testid="switch-notify-down" checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )} />

              <FormField control={form.control} name="notifyOnRecovery" render={({ field }) => (
                <FormItem className="flex items-center justify-between">
                  <FormLabel className="cursor-pointer">Notify on recovery</FormLabel>
                  <FormControl>
                    <Switch data-testid="switch-notify-recovery" checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )} />
            </div>

            <div className="flex items-center justify-end gap-3">
              <Link href="/monitors">
                <Button type="button" variant="outline" data-testid="button-cancel">Cancel</Button>
              </Link>
              <Button type="submit" disabled={create.isPending} data-testid="button-submit">
                {create.isPending ? "Creating..." : "Create monitor"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </AppLayout>
  );
}
