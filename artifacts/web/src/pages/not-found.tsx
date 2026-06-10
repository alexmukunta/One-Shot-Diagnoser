import { Link } from "wouter";
import { Activity } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 text-center">
      <div className="flex items-center gap-2 mb-10">
        <div className="w-7 h-7 rounded bg-primary flex items-center justify-center">
          <Activity className="w-4 h-4 text-white" />
        </div>
        <span className="font-semibold text-sm text-foreground tracking-tight">URL Diagnostics</span>
      </div>
      <div className="text-7xl font-bold text-primary/20 tracking-tighter mb-4 font-mono">404</div>
      <h1 className="text-xl font-semibold text-foreground mb-2">Page not found</h1>
      <p className="text-sm text-muted-foreground mb-8 max-w-xs">
        The page you're looking for doesn't exist or may have been moved.
      </p>
      <div className="flex items-center gap-3">
        <Link href="/dashboard">
          <button className="inline-flex items-center justify-center px-4 py-2 rounded bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors">
            Go to dashboard
          </button>
        </Link>
        <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          Back to home
        </Link>
      </div>
    </div>
  );
}
