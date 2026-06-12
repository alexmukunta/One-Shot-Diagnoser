import { Link } from "wouter";
import { useEffect, useRef, useState } from "react";
import {
  Activity, Shield, Zap, Bell, BarChart2, Globe, Clock,
  ArrowRight, Check,
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
          opacity: phase === "visible" ? 0.08 : 0,
          transform:
            phase === "entering" ? "translateX(60px)" :
            phase === "exiting"  ? "translateX(-60px)" :
            "translateX(0px)",
          transition: "opacity 0.5s ease, transform 0.5s ease",
        }}
        className="flex flex-col items-center gap-4 text-center px-4"
      >
        <Icon
          className="text-primary"
          style={{ width: "min(140px, 30vw)", height: "min(140px, 30vw)" }}
          strokeWidth={0.6}
        />
        <span
          className="font-black text-foreground tracking-tight"
          style={{ fontSize: "clamp(2rem, 8vw, 6rem)", lineHeight: 1 }}
        >
          {feature.label}
        </span>
      </div>
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">

      {/* ─── Header ─── */}
      <header className="border-b border-border/60 px-4 sm:px-6 h-14 flex items-center justify-between sticky top-0 bg-background/95 backdrop-blur-sm z-10 flex-shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded bg-primary flex items-center justify-center flex-shrink-0">
            <Activity className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold text-sm tracking-tight truncate">One Shot Diagnoser</span>
        </div>
        <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
          <Link href="/status/demo" className="hover:text-foreground transition-colors">Live demo</Link>
        </nav>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Link href="/sign-in">
            <Button variant="outline" size="sm">Log in</Button>
          </Link>
          <Link href="/sign-up">
            <Button size="sm" className="gap-1.5">
              Sign up <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>
      </header>

      {/* ─── Hero ─── */}
      <section className="relative overflow-hidden flex-1 flex items-center">
        <BackgroundFeatureCycle />

        {/* Radial vignette */}
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 70% 80% at 50% 50%, transparent 20%, hsl(var(--background) / 0.65) 100%)",
          }}
        />

        <div className="relative z-10 w-full max-w-2xl mx-auto px-4 sm:px-6 py-20 sm:py-32 text-center">
          <h1 className="font-bold tracking-tight leading-[1.1] mb-5"
            style={{ fontSize: "clamp(2.2rem, 7vw, 4rem)" }}>
            Welcome to{" "}
            <span className="text-primary">One Shot Diagnoser</span>
          </h1>

          <p className="text-muted-foreground leading-relaxed mx-auto mb-10"
            style={{ fontSize: "clamp(0.95rem, 2.5vw, 1.125rem)", maxWidth: "36rem" }}>
            Diagnose any URL in one click — check availability, SSL certificates, DNS health, security headers, and performance. Set up scheduled monitors and get alerted the moment something breaks.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/sign-in" className="w-full sm:w-auto">
              <Button variant="outline" size="lg" className="w-full sm:w-auto px-8">
                Log in
              </Button>
            </Link>
            <Link href="/sign-up" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto px-8 gap-2">
                Sign up free
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ─── CTA card ─── */}
      <section className="border-t border-border/60 bg-card/20 flex-shrink-0">
        <div className="max-w-xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
          <div className="bg-card border border-card-border rounded-xl p-6 sm:p-8 text-center">
            <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Activity className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-lg sm:text-xl font-bold mb-2">Ready to start monitoring?</h2>
            <p className="text-sm text-muted-foreground mb-5 max-w-sm mx-auto">
              Create a free account and monitor your first endpoint in under two minutes.
            </p>
            <ul className="flex flex-wrap justify-center gap-x-4 gap-y-1.5 mb-6">
              {[
                "No credit card required",
                "1-minute checks",
                "Email & Slack alerts",
                "SSL monitoring",
              ].map((f) => (
                <li key={f} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Check className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
              <Link href="/sign-in" className="w-full sm:w-auto">
                <Button variant="outline" className="w-full sm:w-auto">Log in</Button>
              </Link>
              <Link href="/sign-up" className="w-full sm:w-auto">
                <Button className="w-full sm:w-auto gap-2" data-testid="button-cta-signup">
                  Create free account
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="border-t border-border/60 px-4 sm:px-6 py-6 flex-shrink-0">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-primary flex items-center justify-center">
              <Activity className="w-3 h-3 text-white" />
            </div>
            <span className="text-sm font-semibold">One Shot Diagnoser</span>
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link>
            <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
            <Link href="/diagnose" className="hover:text-foreground transition-colors">URL Checker</Link>
          </div>
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} One Shot Diagnoser
          </p>
        </div>
      </footer>

    </div>
  );
}
