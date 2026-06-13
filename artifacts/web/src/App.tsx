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
import CronMonitorsPage from "@/pages/cron-monitors";

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
  variables: {
    colorBackground: "#0f1623",
    colorInputBackground: "#1e2d42",
    colorInputText: "#e8edf5",
    colorText: "#e8edf5",
    colorTextSecondary: "#8fa3be",
    colorPrimary: "#0ea5e9",
    colorDanger: "#ef4444",
    colorNeutral: "#8fa3be",
    borderRadius: "0.375rem",
    fontFamily: "Inter, system-ui, sans-serif",
  },
  elements: {
    card: "shadow-2xl",
    headerTitle: "!text-[#e8edf5]",
    headerSubtitle: "!text-[#8fa3be]",
    formButtonPrimary:
      "!bg-[#0ea5e9] hover:!bg-[#0284c7] !text-white !font-medium !shadow-none",
    formButtonSecondary:
      "!bg-[#1e2d42] !border !border-[#2e4060] !text-[#d1dce8] hover:!bg-[#243452]",
    formFieldInput:
      "!bg-[#1e2d42] !border !border-[#2e4060] !text-[#e8edf5] placeholder:!text-[#5a7090] focus:!border-[#0ea5e9]",
    formFieldLabel: "!text-[#8fa3be] !font-medium",
    formFieldHintText: "!text-[#6a859e]",
    socialButtonsBlockButton:
      "!bg-[#1e2d42] !border !border-[#2e4060] !text-[#d1dce8] hover:!bg-[#243452] hover:!border-[#3a5070]",
    socialButtonsBlockButtonText: "!text-[#d1dce8] !font-medium",
    dividerLine: "!bg-[#2e4060]",
    dividerText: "!text-[#5a7090]",
    footerActionLink: "!text-[#0ea5e9] hover:!text-[#38bdf8]",
    footerActionText: "!text-[#6a859e]",
    identityPreviewText: "!text-[#d1dce8]",
    identityPreviewEditButtonIcon: "!text-[#0ea5e9]",
    otpCodeFieldInput:
      "!bg-[#1e2d42] !border !border-[#2e4060] !text-[#e8edf5] focus:!border-[#0ea5e9]",
    navbarButton:
      "!text-[#8fa3be] hover:!text-[#d1dce8] hover:!bg-[#1e2d42]",
    navbarButtonIcon: "!text-[#8fa3be]",
    profileSectionTitleText: "!text-[#d1dce8] !font-medium",
    profileSectionContent: "!border-t !border-[#2e4060]",
    accordionTriggerButton: "!text-[#d1dce8] hover:!bg-[#1e2d42]",
    badge: "!text-[#d1dce8] !border-[#2e4060]",
    menuList: "!border !border-[#2e4060]",
    menuItem: "!text-[#d1dce8] hover:!bg-[#1e2d42]",
    actionCard: "!border !border-[#2e4060]",
    pageScrollBox: "!bg-[#0f1623]",
    userPreviewMainIdentifier: "!text-[#e8edf5]",
    userPreviewSecondaryIdentifier: "!text-[#8fa3be]",
    formResendCodeLink: "!text-[#0ea5e9]",
    alternativeMethodsBlockButton:
      "!bg-[#1e2d42] !border !border-[#2e4060] !text-[#d1dce8] hover:!bg-[#243452]",
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
      <Route path="/cron-monitors" component={() => <ProtectedRoute component={CronMonitorsPage} />} />
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
      actionText: "Already have an account?",
      actionLink: "Sign in instead",
    },
    emailCode: {
      title: "Verify your email",
      subtitle: "Enter the code sent to your email address to continue.",
    },
  },
  unstable__errors: {
    form_identifier_exists__email_address:
      "An account with this email already exists. Please sign in instead.",
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
