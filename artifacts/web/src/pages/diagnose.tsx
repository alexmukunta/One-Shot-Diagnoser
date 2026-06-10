import { useState } from "react";
import { useDiagnoseUrl } from "@workspace/api-client-react";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Zap, CheckCircle, XCircle, AlertTriangle, Shield, Globe, BarChart2, Lock, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

function SectionCard({ title, icon: Icon, children }: { title: string; icon: typeof Zap; children: React.ReactNode }) {
  return (
    <div className="bg-card border border-card-border rounded-lg overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
        <Icon className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm font-medium">{title}</span>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function Row({ label, value, mono = false }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4 py-1.5 border-b border-border/50 last:border-0">
      <span className="text-xs text-muted-foreground flex-shrink-0 w-36">{label}</span>
      <span className={cn("text-xs text-right", mono && "font-mono")}>{value}</span>
    </div>
  );
}

function GradeCircle({ grade, score }: { grade: string; score: number }) {
  const color = grade === "A" ? "text-green-400" : grade === "B" ? "text-blue-400" : grade === "C" ? "text-amber-400" : "text-red-400";
  return (
    <div className="flex flex-col items-center">
      <div className={cn("text-3xl font-bold", color)}>{grade}</div>
      <div className="text-xs text-muted-foreground">{score}/100</div>
    </div>
  );
}

function SecurityCheck({ label, ok }: { label: string; ok: boolean | undefined }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      {ok ? <CheckCircle className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-red-500/50" />}
    </div>
  );
}

export default function DiagnosePage() {
  const [url, setUrl] = useState("");
  const [submitted, setSubmitted] = useState("");

  const diagnose = useDiagnoseUrl();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!url) return;
    setSubmitted(url);
    diagnose.mutate({ data: { url } });
  }

  const result = diagnose.data;

  return (
    <AppLayout>
      <div className="p-6 max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-xl font-semibold mb-1">Diagnose URL</h1>
          <p className="text-sm text-muted-foreground">One-shot check: availability, SSL, DNS, performance, and security headers</p>
        </div>

        <form onSubmit={handleSubmit} className="flex gap-2 mb-8">
          <Input
            type="url"
            placeholder="https://example.com"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="flex-1 font-mono text-sm"
            data-testid="input-diagnose-url"
          />
          <Button type="submit" disabled={diagnose.isPending || !url} className="gap-2 flex-shrink-0" data-testid="button-diagnose-submit">
            <Zap className="w-4 h-4" />
            {diagnose.isPending ? "Checking..." : "Diagnose"}
          </Button>
        </form>

        {diagnose.isPending && (
          <div className="flex flex-col items-center py-16 gap-4">
            <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <div className="text-sm text-muted-foreground">Checking {submitted}...</div>
          </div>
        )}

        {result && !diagnose.isPending && (
          <div className="space-y-4 animate-in fade-in duration-300" data-testid="diagnose-results">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
              <span className="font-mono truncate">{result.url}</span>
              <span>{format(new Date(result.checkedAt), "HH:mm:ss")}</span>
            </div>

            {/* Availability */}
            <SectionCard title="Availability" icon={Globe}>
              <div className="flex items-center gap-3 mb-3">
                {result.availability.status === "up"
                  ? <CheckCircle className="w-5 h-5 text-green-500" />
                  : result.availability.status === "down"
                  ? <XCircle className="w-5 h-5 text-red-500" />
                  : <AlertTriangle className="w-5 h-5 text-amber-500" />
                }
                <span className={cn(
                  "font-semibold",
                  result.availability.status === "up" ? "text-green-400" : result.availability.status === "down" ? "text-red-400" : "text-amber-400"
                )}>
                  {result.availability.status.toUpperCase()}
                </span>
                {result.availability.httpStatus && (
                  <Badge variant="outline" className="font-mono text-xs">{result.availability.httpStatus}</Badge>
                )}
                {result.availability.responseTimeMs && (
                  <span className="text-xs text-muted-foreground font-mono ml-auto">{result.availability.responseTimeMs}ms</span>
                )}
              </div>
              {result.availability.errorMessage && (
                <div className="text-xs font-mono text-red-400 bg-red-500/5 border border-red-500/20 rounded px-3 py-2">
                  {result.availability.errorMessage}
                </div>
              )}
            </SectionCard>

            {/* SSL */}
            {result.ssl && (
              <SectionCard title="SSL Certificate" icon={Lock}>
                <Row label="Valid" value={result.ssl.valid ? <CheckCircle className="w-4 h-4 text-green-500 ml-auto" /> : <XCircle className="w-4 h-4 text-red-500 ml-auto" />} />
                <Row label="Issuer" value={result.ssl.issuer ?? "—"} />
                <Row label="Expires" value={result.ssl.expiresAt ? format(new Date(result.ssl.expiresAt), "MMM d, yyyy") : "—"} />
                <Row label="Days remaining" value={
                  result.ssl.daysRemaining != null
                    ? <span className={result.ssl.daysRemaining < 30 ? "text-amber-400" : "text-green-400"}>{result.ssl.daysRemaining} days</span>
                    : "—"
                } />
                <Row label="Protocol" value={result.ssl.protocol ?? "—"} mono />
                <Row label="Cipher" value={result.ssl.cipher ?? "—"} mono />
              </SectionCard>
            )}

            {/* DNS */}
            {result.dns && (
              <SectionCard title="DNS" icon={Globe}>
                <Row label="Resolved" value={result.dns.resolved ? <CheckCircle className="w-4 h-4 text-green-500 ml-auto" /> : <XCircle className="w-4 h-4 text-red-500 ml-auto" />} />
                <Row label="IP address" value={result.dns.ipAddress ?? "—"} mono />
                {result.dns.aRecords && result.dns.aRecords.length > 0 && (
                  <Row label="A records" value={result.dns.aRecords.join(", ")} mono />
                )}
              </SectionCard>
            )}

            {/* Performance */}
            {result.performance && (
              <SectionCard title="Performance" icon={BarChart2}>
                <div className="flex items-center gap-6 mb-4">
                  <GradeCircle grade={result.performance.grade} score={result.performance.score} />
                  <div className="flex-1 space-y-2">
                    {result.performance.ttfbMs && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Time to first byte</span>
                        <span className="font-mono">{result.performance.ttfbMs}ms</span>
                      </div>
                    )}
                    {result.performance.responseSizeKb && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Response size</span>
                        <span className="font-mono">{result.performance.responseSizeKb.toFixed(1)} KB</span>
                      </div>
                    )}
                    {result.performance.compression && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Compression</span>
                        <span className="font-mono">{result.performance.compression}</span>
                      </div>
                    )}
                  </div>
                </div>
              </SectionCard>
            )}

            {/* Security headers */}
            {result.security && (
              <SectionCard title="Security Headers" icon={Shield}>
                <div className="flex items-center gap-4 mb-4">
                  <GradeCircle
                    grade={result.security.score >= 80 ? "A" : result.security.score >= 60 ? "B" : result.security.score >= 40 ? "C" : "F"}
                    score={result.security.score}
                  />
                  <div className="flex-1">
                    <SecurityCheck label="HSTS" ok={result.security.hsts} />
                    <SecurityCheck label="X-Frame-Options" ok={result.security.xFrameOptions} />
                    <SecurityCheck label="Content-Security-Policy" ok={result.security.csp} />
                    <SecurityCheck label="X-Content-Type-Options" ok={result.security.xContentType} />
                    <SecurityCheck label="Referrer-Policy" ok={result.security.referrerPolicy} />
                  </div>
                </div>
              </SectionCard>
            )}

            {/* Redirect chain */}
            {result.redirectChain && result.redirectChain.length > 0 && (
              <SectionCard title="Redirect Chain" icon={ArrowRight}>
                <div className="space-y-2">
                  {result.redirectChain.map((r, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      <Badge variant="outline" className="font-mono flex-shrink-0">{r.status}</Badge>
                      <span className="text-muted-foreground font-mono truncate">{r.from}</span>
                      <ArrowRight className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                      <span className="font-mono truncate">{r.to}</span>
                    </div>
                  ))}
                </div>
              </SectionCard>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
