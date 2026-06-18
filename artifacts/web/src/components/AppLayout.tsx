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
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  SidebarTrigger,
  SidebarInset,
  SidebarFooter,
} from "@/components/ui/sidebar";

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
    <SidebarProvider>
      <Sidebar collapsible="offcanvas" className="bg-sidebar border-r border-sidebar-border">
        <SidebarHeader className="h-14 flex items-center px-4 border-b border-sidebar-border">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded overflow-hidden flex items-center justify-center">
              <img src="/status-icon.png" alt="Logo" className="w-full h-full object-contain" />
            </div>
            <span className="font-semibold text-sidebar-foreground tracking-tight text-sm">
              One Shot Diagnoser
            </span>
          </div>
        </SidebarHeader>

        <SidebarContent className="px-2 py-3">
          <SidebarMenu>
            {NAV.map(({ href, label, icon: Icon }) => {
              const active = location === href || location.startsWith(href + "/");
              return (
                <SidebarMenuItem key={href}>
                  <SidebarMenuButton
                    asChild
                    isActive={active}
                    className={cn(
                      active ? "bg-sidebar-accent text-primary" : "text-sidebar-foreground"
                    )}
                  >
                    <Link href={href} data-testid={`nav-${label.toLowerCase().replace(/\s+/g, "-")}`}>
                      <Icon className="w-4 h-4" />
                      <span>{label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarContent>

        <SidebarFooter className="border-t border-sidebar-border p-2">
          <button
            data-testid="user-menu-button"
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="w-full flex items-center gap-2 px-3 py-2 rounded hover:bg-sidebar-accent text-sidebar-foreground text-sm transition-colors"
          >
            <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
              {user?.imageUrl ? (
                <img src={user.imageUrl} alt="avatar" className="w-6 h-6 rounded-full object-cover" />
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
        </SidebarFooter>
      </Sidebar>

      <SidebarInset>
        <header className="h-14 border-b flex items-center px-4">
          <SidebarTrigger />
        </header>
        <main className="flex-1 overflow-y-auto">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
