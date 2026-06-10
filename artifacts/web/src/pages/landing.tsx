import { Link } from "wouter";
import { useEffect, useRef, useState } from "react";
import {
  Activity, Shield, Zap, Bell, BarChart2, Globe,
  ArrowRight, Check, Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const FEATURES = [
  { icon: Clock,     label: "Checks every 60 seconds" },
  { icon: Shield,    label: "SSL expiry alerts" },
  { icon: Bell,      label: "Alerts where you work" },
  { icon: BarChart2, label: "90-day uptime history" },
  { icon: Globe,     label: "Public status pages" },
  { icon: Zap,       label: "One-shot URL diagnostics" },
];

type Phase = "entering" | "visible" | "exiting";

function BackgroundFeatureCycle() {
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("entering");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (phase === "entering") {
      timerRef.current = setTimeout(() => setPhase("visible"), 500);
    } else if (phase === "visible") {
      timerRef.current = setTimeout(() => setPhase("exiting"), 2600);
    } else {
      timerRef.current = setTimeout(() => {
        setIndex((i) => (i + 1) % FEATURES.length);
        setPhase("entering");
      }, 500);
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [phase]);

  const feature = FEATURES[index];
  const Icon = feature.icon;

  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden select-none"
    >
      <div
        style={{
          opacity: phase === "visible" ? 0.13 : 0,
          transform:
            phase === "entering" ? "translateX(80px)" :
            phase === "exiting"  ? "translateX(-80px)" :
            "translateX(0px)",
          transition: "opacity 0.5s ease, transform 0.5s ease",
        }}
        className="flex flex-col items-center gap-6 text-center"
      >
        <Icon
          className="text-primary"
          style={{ width: 160, height: 160 }}
          strokeWidth={0.6}
        />
        <span
          className="font-black text-foreground tracking-tight"
          style={{ fontSize: "clamp(3.5rem, 10vw, 7rem)", lineHeight: 1, whiteSpace: "nowrap" }}
        >
          {feature.label}
        </span>
      </div>
    </div>
  );
}

function Step({ num, title, desc }: { num: string; title: string; desc: string }) {
  return (
    <div className="flex gap-4">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-xs font-bold text-primary">
        {num}
      </div>
      <div className="pt-0.5">
        <div className="text-sm font-semibold text-foreground mb-1">{title}</div>
        <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">

      {/* ─── Header ─── */}
      <header className="border-b border-border/60 px-6 h-14 flex items-center justify-between sticky top-0 bg-background/95 backdrop-blur-sm z-10">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded bg-primary flex items-center justify-center">
            <Activity className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold text-sm tracking-tight">URL Diagnostics</span>
        </div>
        <nav className="hidden sm:flex items-center gap-6 text-sm text-muted-foreground">
          <a href="#how-it-works" className="hover:text-foreground transition-colors">How it works</a>
          <Link href="/status/demo" className="hover:text-foreground transition-colors">Live demo</Link>
        </nav>
        <div className="flex items-center gap-3">
          <Link href="/sign-in" className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:block">
            Sign in
          </Link>
          <Link href="/sign-up">
            <Button size="sm" className="gap-1.5">
              Get started <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>
      </header>

      {/* ─── Hero ─── */}
      <section className="relative overflow-hidden">
        <BackgroundFeatureCycle />

        {/* Vignette so edges don't clip awkwardly */}
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 60% 70% at 50% 50%, transparent 30%, hsl(var(--background) / 0.55) 100%)",
          }}
        />

        <div className="relative z-10 max-w-3xl mx-auto px-6 py-36 sm:py-44 text-center">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary border border-primary/20 rounded-full px-3 py-1 text-xs font-medium mb-8">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
            Beta · Free while we're getting started
          </div>

          <h1 className="text-5xl sm:text-6xl font-bold tracking-tight leading-[1.1] mb-6">
            Know when your{" "}
            <span className="text-primary">services go down</span>
            {" "}before your users do.
          </h1>

          <p className="text-lg text-muted-foreground leading-relaxed max-w-xl mx-auto">
            Automated endpoint monitoring with 60-second checks, SSL certificate tracking, and real-time incident alerts. Your infrastructure watched around the clock — your team responds first.
          </p>
        </div>
      </section>

      {/* ─── How it works ─── */}
      <section id="how-it-works" className="border-t border-border/60">
        <div className="max-w-3xl mx-auto px-6 py-20">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold mb-3">Up and running in two minutes</h2>
            <p className="text-sm text-muted-foreground">No agents to install. No config files to write.</p>
          </div>
          <div className="space-y-8">
            <Step
              num="1"
              title="Add a URL"
              desc="Paste any public URL — your API, your marketing site, your checkout page. Set how often to check it and what HTTP status means 'up'."
            />
            <Step
              num="2"
              title="Connect your alerts"
              desc="Link a Slack channel, Discord webhook, email address, or any custom endpoint. Alerts fire within 60 seconds of detection — before your customers notice."
            />
            <Step
              num="3"
              title="Watch the dashboard"
              desc="See uptime history, response-time charts, and active incidents in one place. Share a public status page with your users so they always know what's happening."
            />
          </div>
        </div>
      </section>

      {/* ─── Stats strip ─── */}
      <div className="border-y border-border/60 bg-card/40">
        <div className="max-w-4xl mx-auto px-6 py-8 grid grid-cols-3 gap-6 text-center">
          {[
            { value: "60s",   label: "Minimum check interval" },
            { value: "< 30s", label: "Mean detection time" },
            { value: "99.9%", label: "Checker infrastructure uptime" },
          ].map(({ value, label }) => (
            <div key={label}>
              <div className="text-2xl font-bold text-primary mb-1">{value}</div>
              <div className="text-xs text-muted-foreground">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── CTA ─── */}
      <section className="border-t border-border/60 bg-card/20">
        <div className="max-w-3xl mx-auto px-6 py-20">
          <div className="bg-card border border-card-border rounded-xl p-8 sm:p-10 text-center">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-5">
              <Activity className="w-6 h-6 text-primary" />
            </div>
            <h2 className="text-xl font-bold mb-3">Ready to stop being the last to know?</h2>
            <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
              Create a free account, add your first monitor, and know within 60 seconds if something breaks.
            </p>
            <ul className="flex flex-wrap justify-center gap-x-5 gap-y-1.5 mb-7">
              {[
                "50 monitors free",
                "1-minute checks",
                "Slack, Discord & email alerts",
                "SSL monitoring",
                "Public status pages",
              ].map((f) => (
                <li key={f} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Check className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <Link href="/sign-up">
              <Button size="lg" className="gap-2 w-full sm:w-auto" data-testid="button-cta-signup">
                Create free account
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="border-t border-border/60 px-6 py-8">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-primary flex items-center justify-center">
              <Activity className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-sm font-semibold">URL Diagnostics</span>
          </div>
          <div className="flex items-center gap-5 text-xs text-muted-foreground">
            <Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link>
            <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
            <Link href="/diagnose" className="hover:text-foreground transition-colors">URL Checker</Link>
          </div>
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} URL Diagnostics · Built for engineers
          </p>
        </div>
      </footer>

    </div>
  );
}
