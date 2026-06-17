import { Link, useLocation } from "wouter";
import { useClerk, useUser } from "@clerk/react";
import {
  LayoutDashboard,
  Activity,
  AlertTriangle,
  Bell,
  Globe,
  Zap,
  ChevronDown,
  LogOut,
  User,
  Settings,
  Timer,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/monitors", label: "Monitors", icon: Activity },
  { href: "/incidents", label: "Incidents", icon: AlertTriangle },
  { href: "/cron-monitors", label: "Cron Monitors", icon: Timer },
  { href: "/alert-channels", label: "Alert Channels", icon: Bell },
  { href: "/status-pages", label: "Status Pages", icon: Globe },
  { href: "/diagnose", label: "Diagnose URL", icon: Zap },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { signOut, openUserProfile } = useClerk();
  const { user } = useUser();
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <aside className="w-56 flex-shrink-0 bg-sidebar border-r border-sidebar-border flex flex-col">
        {/* Logo */}
        <div className="h-14 flex items-center px-4 border-b border-sidebar-border">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded overflow-hidden flex items-center justify-center">
              <img src="/status-icon.png" alt="Logo" className="w-full h-full object-contain" />
            </div>
            <span className="font-semibold text-sidebar-foreground tracking-tight text-sm">
              One Shot Diagnoser
            </span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = location === href || location.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                data-testid={`nav-${label.toLowerCase().replace(/\s+/g, "-")}`}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2 rounded text-sm font-medium transition-colors",
                  active
                    ? "bg-sidebar-accent text-primary"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* User menu */}
        <div className="p-2 border-t border-sidebar-border">
          <button
            data-testid="user-menu-button"
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="w-full flex items-center gap-2 px-3 py-2 rounded hover:bg-sidebar-accent text-sidebar-foreground text-sm transition-colors"
          >
            <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
              {user?.imageUrl ? (
                <img
                  src={user.imageUrl}
                  alt="avatar"
                  className="w-6 h-6 rounded-full object-cover"
                />
              ) : (
                <User className="w-3.5 h-3.5 text-primary" />
              )}
            </div>
            <span className="flex-1 text-left truncate text-xs">
              {user?.primaryEmailAddress?.emailAddress ?? user?.username ?? "Account"}
            </span>
            <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", userMenuOpen && "rotate-180")} />
          </button>
          {userMenuOpen && (
            <div className="mt-1 bg-popover border border-popover-border rounded shadow-lg overflow-hidden">
              <button
                data-testid="manage-account-button"
                onClick={() => { openUserProfile(); setUserMenuOpen(false); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-accent transition-colors"
              >
                <Settings className="w-3.5 h-3.5" />
                Manage account
              </button>
              <button
                data-testid="sign-out-button"
                onClick={() => signOut({ redirectUrl: basePath || "/" })}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-accent transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign out
              </button>
            </div>
          )}
          <div className="mt-2 px-3 flex items-center justify-between text-[10px] text-sidebar-foreground/50">
            <Link href="/terms" className="hover:text-primary transition-colors">Terms</Link>
            <Link href="/privacy" className="hover:text-primary transition-colors">Privacy</Link>
            <Link href="/cookies" className="hover:text-primary transition-colors">Cookies</Link>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
