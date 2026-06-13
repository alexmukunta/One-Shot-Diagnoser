import {
  Activity, Shield, Zap, Bell, BarChart2, Globe, Clock,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

const FEATURES = [
  { icon: Clock,     label: "Checks every 60 seconds",  desc: "Continuous uptime monitoring with minute-level frequency" },
  { icon: Shield,    label: "SSL expiry alerts",         desc: "Get notified 30, 14, 7, and 3 days before certificates expire" },
  { icon: Bell,      label: "Alerts where you work",     desc: "Email, Slack, Discord, and webhook delivery" },
  { icon: BarChart2, label: "90-day uptime history",     desc: "Response time charts and uptime percentage breakdowns" },
  { icon: Globe,     label: "Public status pages",       desc: "Share live status pages with your customers" },
  { icon: Zap,       label: "One-shot URL diagnostics",  desc: "Instant checks for availability, DNS, headers, and performance" },
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
          opacity: phase === "visible" ? 0.07 : 0,
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
      <header className="border-b border-border/60 px-4 sm:px-6 h-14 flex items-center sticky top-0 bg-background/95 backdrop-blur-sm z-10 flex-shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded bg-primary flex items-center justify-center flex-shrink-0">
            <Activity className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold text-sm tracking-tight truncate">One Shot Diagnoser</span>
        </div>
      </header>

      {/* ─── Hero ─── */}
      <section className="relative overflow-hidden flex-1 flex flex-col items-center justify-center">
        <BackgroundFeatureCycle />

        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 70% 80% at 50% 50%, transparent 20%, hsl(var(--background) / 0.65) 100%)",
          }}
        />

        <div className="relative z-10 w-full max-w-3xl mx-auto px-4 sm:px-6 py-16 sm:py-24 text-center">
          <h1
            className="font-bold tracking-tight leading-[1.1] mb-4"
            style={{ fontSize: "clamp(2.2rem, 7vw, 4rem)" }}
          >
            Welcome to{" "}
            <span className="text-primary">One Shot Diagnoser</span>
          </h1>

          <p
            className="text-muted-foreground leading-relaxed mx-auto mb-14"
            style={{ fontSize: "clamp(0.95rem, 2.5vw, 1.1rem)", maxWidth: "36rem" }}
          >
            Uptime monitoring, SSL tracking, and one-shot URL diagnostics — all in one place.
          </p>

          {/* ─── Feature grid ─── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-left">
            {FEATURES.map(({ icon: Icon, label, desc }) => (
              <div
                key={label}
                className="bg-card/60 border border-card-border backdrop-blur-sm rounded-lg px-4 py-3.5 flex items-start gap-3"
              >
                <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Icon className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <div className="text-sm font-medium text-foreground">{label}</div>
                  <div className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="border-t border-border/60 px-4 sm:px-6 py-5 flex-shrink-0">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-primary flex items-center justify-center">
              <Activity className="w-3 h-3 text-white" />
            </div>
            <span className="text-sm font-semibold">One Shot Diagnoser</span>
          </div>
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} One Shot Diagnoser
          </p>
        </div>
      </footer>

    </div>
  );
}
