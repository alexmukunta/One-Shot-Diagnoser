import type { ReactNode } from "react";
import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ClerkProvider, SignIn, SignUp, useUser } from "@clerk/react";
import { publishableKeyFromHost } from "@clerk/react/internal";
import { shadcn } from "@clerk/themes";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import NotFound from "@/pages/not-found";
import TermsPage from "@/pages/terms";
import PrivacyPage from "@/pages/privacy";
import LandingPage from "@/pages/landing";
import DashboardPage from "@/pages/dashboard";
import MonitorsPage from "@/pages/monitors";
import MonitorNewPage from "@/pages/monitor-new";
import MonitorDetailPage from "@/pages/monitor-detail";
import MonitorEditPage from "@/pages/monitor-edit";
import IncidentsPage from "@/pages/incidents";
import IncidentDetailPage from "@/pages/incident-detail";
import AlertChannelsPage from "@/pages/alert-channels";
import StatusPagesPage from "@/pages/status-pages";
import PublicStatusPage from "@/pages/status-public";
import DiagnosePage from "@/pages/diagnose";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;
const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

const clerkAppearance = {
  baseTheme: shadcn,
  layout: { cssLayerName: "clerk" },
  variables: {
    colorBackground: "hsl(222, 47%, 6%)",
    colorInputBackground: "hsl(222, 40%, 9%)",
    colorInputText: "hsl(215, 20%, 90%)",
    colorText: "hsl(215, 20%, 90%)",
    colorTextSecondary: "hsl(215, 15%, 55%)",
    colorPrimary: "hsl(199, 89%, 48%)",
    colorDanger: "hsl(0, 72%, 51%)",
    borderRadius: "0.375rem",
    fontFamily: "Inter, system-ui, sans-serif",
  },
  elements: {
    card: "bg-[hsl(222,40%,8%)] border border-[hsl(222,30%,14%)] shadow-2xl",
    formButtonPrimary: "bg-[hsl(199,89%,48%)] hover:bg-[hsl(199,89%,43%)] text-white",
    footerActionLink: "text-[hsl(199,89%,48%)]",
  },
};

function HomeRoute() {
  const { isSignedIn, isLoaded } = useUser();
  if (!isLoaded) return null;
  if (isSignedIn) return <Redirect to="/dashboard" />;
  return <LandingPage />;
}

function ProtectedRoute({ component: Component }: { component: () => ReactNode }) {
  const { isSignedIn, isLoaded } = useUser();
  if (!isLoaded)
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  if (!isSignedIn) return <Redirect to="/sign-in" />;
  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomeRoute} />
      <Route
        path="/sign-in/*?"
        component={() => (
          <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <SignIn routing="path" path={`${basePath}/sign-in`} appearance={clerkAppearance} />
          </div>
        )}
      />
      <Route
        path="/sign-up/*?"
        component={() => (
          <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <SignUp routing="path" path={`${basePath}/sign-up`} appearance={clerkAppearance} />
          </div>
        )}
      />
      <Route path="/status/:slug" component={PublicStatusPage} />
      <Route path="/terms" component={TermsPage} />
      <Route path="/privacy" component={PrivacyPage} />
      <Route path="/dashboard" component={() => <ProtectedRoute component={DashboardPage} />} />
      <Route path="/monitors/new" component={() => <ProtectedRoute component={MonitorNewPage} />} />
      <Route path="/monitors/:id/edit" component={() => <ProtectedRoute component={MonitorEditPage} />} />
      <Route path="/monitors/:id" component={() => <ProtectedRoute component={MonitorDetailPage} />} />
      <Route path="/monitors" component={() => <ProtectedRoute component={MonitorsPage} />} />
      <Route path="/incidents/:id" component={() => <ProtectedRoute component={IncidentDetailPage} />} />
      <Route path="/incidents" component={() => <ProtectedRoute component={IncidentsPage} />} />
      <Route path="/alert-channels" component={() => <ProtectedRoute component={AlertChannelsPage} />} />
      <Route path="/status-pages" component={() => <ProtectedRoute component={StatusPagesPage} />} />
      <Route path="/diagnose" component={() => <ProtectedRoute component={DiagnosePage} />} />
      <Route component={NotFound} />
    </Switch>
  );
}

const clerkLocalization = {
  signIn: {
    start: {
      title: "Sign in to One Shot Diagnoser",
      subtitle: "Welcome back! Please sign in to continue.",
    },
  },
  signUp: {
    start: {
      title: "Create your account",
      subtitle: "Welcome to One Shot Diagnoser — start monitoring in minutes.",
    },
  },
};

function App() {
  return (
    <ErrorBoundary>
      <ClerkProvider publishableKey={clerkPubKey} proxyUrl={clerkProxyUrl} appearance={clerkAppearance} localization={clerkLocalization}>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <WouterRouter base={basePath}>
              <Router />
            </WouterRouter>
            <Toaster />
          </TooltipProvider>
        </QueryClientProvider>
      </ClerkProvider>
    </ErrorBoundary>
  );
}

export default App;
