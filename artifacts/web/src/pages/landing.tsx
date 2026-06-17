import { Activity } from "lucide-react";
import { Link } from "wouter";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="border-b border-border/60 px-4 sm:px-6 h-14 flex items-center sticky top-0 bg-background/95 backdrop-blur-sm z-10 flex-shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded overflow-hidden flex items-center justify-center flex-shrink-0">
            <img src="/status-icon.png" alt="Logo" className="w-full h-full object-contain" />
          </div>
          <span className="font-semibold text-sm tracking-tight truncate">One Shot Diagnoser</span>
        </div>
      </header>

      <section className="relative overflow-hidden flex-1 flex flex-col items-center justify-center">
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: "url('/landing-wallpaper.png')",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
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
          <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-8">
            Professional-grade uptime monitoring, SSL/DNS diagnostics, and incident tracking for your services.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/sign-in"
              className="inline-flex items-center justify-center rounded-md bg-primary px-5 py-3 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
            >
              Sign In
            </Link>
            <Link
              href="/sign-up"
              className="inline-flex items-center justify-center rounded-md border border-border bg-background px-5 py-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-border/60 px-4 sm:px-6 py-5 flex-shrink-0">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded overflow-hidden flex items-center justify-center">
              <img src="/status-icon.png" alt="Logo" className="w-full h-full object-contain" />
            </div>
            <span className="text-sm font-semibold">One Shot Diagnoser</span>
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link>
            <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
            <Link href="/cookies" className="hover:text-foreground transition-colors">Cookies</Link>
          </div>
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} One Shot Diagnoser
          </p>
        </div>
      </footer>
    </div>
  );
}
