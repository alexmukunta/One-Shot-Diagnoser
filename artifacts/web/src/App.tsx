import { type ReactNode, useEffect } from "react";
import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CookieBanner } from "@/components/CookieBanner";
import { ClerkProvider, SignIn, SignUp, useUser, useAuth } from "@clerk/react";
import { publishableKeyFromHost } from "@clerk/react/internal";
import { dark } from "@clerk/themes";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { setAuthTokenGetter } from "@workspace/api-client-react";
import NotFound from "@/pages/not-found";
import TermsPage from "@/pages/terms";
import PrivacyPage from "@/pages/privacy";
import CookiePolicyPage from "@/pages/cookies";
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
  baseTheme: dark,
  variables: {
    colorBackground: "#0f1623",
    colorInputBackground: "#1e2d42",
    colorInputText: "#ffffff",
    colorText: "#ffffff",
    colorTextSecondary: "#e2e8f0",
    colorPrimary: "#38bdf8",
    colorDanger: "#f87171",
    colorNeutral: "#e2e8f0",
    borderRadius: "0.375rem",
    fontFamily: "Inter, system-ui, sans-serif",
  },
  elements: {
    card: "shadow-2xl border border-[#2e4060]",
    headerTitle: "!text-white !font-bold",
    headerSubtitle: "!text-[#e2e8f0]",
    formButtonPrimary:
      "!bg-[#0ea5e9] hover:!bg-[#38bdf8] !text-white !font-semibold !shadow-none",
    formButtonSecondary:
      "!bg-[#1e2d42] !border !border-[#3a5070] !text-[#f8fafc] hover:!bg-[#243452]",
    formFieldInput:
      "!bg-[#1e2d42] !border !border-[#3a5070] !text-white placeholder:!text-[#94a3b8] focus:!border-[#38bdf8]",
    formFieldLabel: "!text-[#f8fafc] !font-semibold",
    formFieldHintText: "!text-[#cbd5e1]",
    socialButtonsBlockButton:
      "!bg-[#1e2d42] !border !border-[#3a5070] !text-[#f8fafc] hover:!bg-[#243452] hover:!border-[#4a6080]",
    socialButtonsBlockButtonText: "!text-[#f8fafc] !font-semibold",
    dividerLine: "!bg-[#3a5070]",
    dividerText: "!text-[#cbd5e1]",
    footerActionLink: "!text-[#38bdf8] hover:!text-[#7dd3fc] !font-medium",
    footerActionText: "!text-[#cbd5e1]",
    identityPreviewText: "!text-[#f8fafc]",
    identityPreviewEditButtonIcon: "!text-[#38bdf8]",
    otpCodeFieldInput:
      "!bg-[#1e2d42] !border !border-[#3a5070] !text-white focus:!border-[#38bdf8]",
    navbarButton:
      "!text-[#f8fafc] hover:!text-white hover:!bg-[#1e2d42] !font-medium",
    navbarButtonIcon: "!text-[#f8fafc]",
    profileSectionTitleText: "!text-white !font-bold !text-lg",
    profileSectionContent: "!border-t !border-[#3a5070] !py-6",
    accordionTriggerButton: "!text-white hover:!bg-[#1e2d42] !font-medium",
    badge: "!text-[#f8fafc] !border-[#3a5070] !bg-[#1e2d42]",
    menuList: "!border !border-[#3a5070] !bg-[#0f1623]",
    menuItem: "!text-white hover:!bg-[#1e2d42]",
    actionCard: "!border !border-[#3a5070] !bg-[#1e2d42]",
    pageScrollBox: "!bg-[#0f1623]",
    userPreviewMainIdentifier: "!text-white !font-bold",
    userPreviewSecondaryIdentifier: "!text-[#e2e8f0]",
    formResendCodeLink: "!text-[#38bdf8]",
    alternativeMethodsBlockButton:
      "!bg-[#1e2d42] !border !border-[#3a5070] !text-[#f8fafc] hover:!bg-[#243452]",
    profilePage__headerTitle: "!text-white !font-bold !text-2xl",
    profilePage__headerSubtitle: "!text-[#e2e8f0]",
    profileSection__title: "!text-white !font-bold",
    userButtonPopoverActionButtonText: "!text-white",
    userButtonPopoverActionButtonIcon: "!text-[#38bdf8]",
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
      <Route path="/cookies" component={CookiePolicyPage} />
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

function AuthTokenSetter() {
  const { getToken } = useAuth();
  useEffect(() => {
    setAuthTokenGetter(getToken);
  }, [getToken]);
  return null;
}

function App() {
  return (
    <ErrorBoundary>
      <ClerkProvider publishableKey={clerkPubKey} proxyUrl={clerkProxyUrl} appearance={clerkAppearance} localization={clerkLocalization}>
        <AuthTokenSetter />
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <WouterRouter base={basePath}>
              <Router />
            </WouterRouter>
            <Toaster />
            <CookieBanner />
          </TooltipProvider>
        </QueryClientProvider>
      </ClerkProvider>
    </ErrorBoundary>
  );
}

export default App;
