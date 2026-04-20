import { Suspense, lazy, useState, type ComponentType } from "react";
import { Route, Switch, useLocation } from "wouter";
import { useAuth } from "./hooks/use-auth";
import { CookieConsent } from "./components/CookieConsent";
import { RouteLoader } from "./components/RouteLoader";
import { Toaster } from "./components/ui/toaster";
import { DocsLayoutProvider, isDocsSubdomain, toCanonicalDocsPath } from "./components/DocsLayout";
import { usePageSeo } from "./lib/seo";
import { cn } from "./lib/utils";
import Header from "./components/Header";
import Sidebar, { MobileMenuButton } from "./components/Sidebar";
import { PublicLayout } from "./components/PublicLayout";

const Landing = lazy(() => import("./pages/Landing"));
const Home = lazy(() => import("./pages/Home"));
const Browse = lazy(() => import("./pages/Browse"));
const SkillDetail = lazy(() => import("./pages/SkillDetail"));
const Terms = lazy(() => import("./pages/Terms"));
const Privacy = lazy(() => import("./pages/Privacy"));
const CreateSkill = lazy(() => import("./pages/CreateSkill"));
const MySkills = lazy(() => import("./pages/MySkills"));
const Profile = lazy(() => import("./pages/Profile"));
const SettingsProfile = lazy(() => import("./pages/SettingsProfile"));
const SettingsTokens = lazy(() => import("./pages/SettingsTokens"));
const SettingsAppearance = lazy(() => import("./pages/SettingsAppearance"));
const SettingsAI = lazy(() => import("./pages/SettingsAI"));
const Starred = lazy(() => import("./pages/Starred"));
const Validate = lazy(() => import("./pages/Validate"));
const AIGenerator = lazy(() => import("./pages/AIGenerator"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const NotFound = lazy(() => import("./pages/NotFound"));

const DocsGettingStarted = lazy(() => import("./pages/docs/GettingStarted"));
const DocsNotFound = lazy(() => import("./pages/docs/NotFound"));
const DocsQuickStart = lazy(() => import("./pages/docs/QuickStart"));
const DocsAccount = lazy(() => import("./pages/docs/Account"));
const DocsSkillFormat = lazy(() => import("./pages/docs/SkillFormat"));
const DocsSkillFormatFrontmatter = lazy(() => import("./pages/docs/SkillFormatFrontmatter"));
const DocsSkillFormatBody = lazy(() => import("./pages/docs/SkillFormatBody"));
const DocsSkillFormatExamples = lazy(() => import("./pages/docs/SkillFormatExamples"));
const DocsPlatform = lazy(() => import("./pages/docs/Platform"));
const DocsPlatformPublishing = lazy(() => import("./pages/docs/PlatformPublishing"));
const DocsPlatformVersions = lazy(() => import("./pages/docs/PlatformVersions"));
const DocsPlatformCollaboration = lazy(() => import("./pages/docs/PlatformCollaboration"));
const DocsPlatformForking = lazy(() => import("./pages/docs/PlatformForking"));
const DocsCLI = lazy(() => import("./pages/docs/CLI"));
const DocsCLIAuth = lazy(() => import("./pages/docs/CLIAuth"));
const DocsCLIPublishInstall = lazy(() => import("./pages/docs/CLIPublishInstall"));
const DocsCLISearch = lazy(() => import("./pages/docs/CLISearch"));
const DocsCLIValidation = lazy(() => import("./pages/docs/CLIValidation"));
const DocsCLITemplates = lazy(() => import("./pages/docs/CLITemplates"));
const DocsCLIDependencies = lazy(() => import("./pages/docs/CLIDependencies"));
const DocsValidation = lazy(() => import("./pages/docs/Validation"));
const DocsValidationCriteria = lazy(() => import("./pages/docs/ValidationCriteria"));
const DocsValidationImproving = lazy(() => import("./pages/docs/ValidationImproving"));
const DocsAI = lazy(() => import("./pages/docs/AI"));
const DocsAIExplainer = lazy(() => import("./pages/docs/AIExplainer"));
const DocsAIGenerator = lazy(() => import("./pages/docs/AIGenerator"));
const DocsAIChat = lazy(() => import("./pages/docs/AIChat"));
const DocsTokens = lazy(() => import("./pages/docs/Tokens"));
const DocsTokensCreating = lazy(() => import("./pages/docs/TokensCreating"));
const DocsTokensScopes = lazy(() => import("./pages/docs/TokensScopes"));
const DocsTokensCLIUsage = lazy(() => import("./pages/docs/TokensCLIUsage"));

type LazyRouteComponent = ComponentType<any>;

const docsRouteMap: Record<string, LazyRouteComponent> = {
  "/docs": DocsGettingStarted,
  "/docs/quick-start": DocsQuickStart,
  "/docs/account": DocsAccount,
  "/docs/skill-format": DocsSkillFormat,
  "/docs/skill-format/frontmatter": DocsSkillFormatFrontmatter,
  "/docs/skill-format/body": DocsSkillFormatBody,
  "/docs/skill-format/examples": DocsSkillFormatExamples,
  "/docs/platform": DocsPlatform,
  "/docs/platform/publishing": DocsPlatformPublishing,
  "/docs/platform/versions": DocsPlatformVersions,
  "/docs/platform/collaboration": DocsPlatformCollaboration,
  "/docs/platform/forking": DocsPlatformForking,
  "/docs/cli": DocsCLI,
  "/docs/cli/auth": DocsCLIAuth,
  "/docs/cli/publish-install": DocsCLIPublishInstall,
  "/docs/cli/search": DocsCLISearch,
  "/docs/cli/validation": DocsCLIValidation,
  "/docs/cli/templates": DocsCLITemplates,
  "/docs/cli/dependencies": DocsCLIDependencies,
  "/docs/validation": DocsValidation,
  "/docs/validation/criteria": DocsValidationCriteria,
  "/docs/validation/improving": DocsValidationImproving,
  "/docs/ai": DocsAI,
  "/docs/ai/explainer": DocsAIExplainer,
  "/docs/ai/generator": DocsAIGenerator,
  "/docs/ai/chat": DocsAIChat,
  "/docs/tokens": DocsTokens,
  "/docs/tokens/creating": DocsTokensCreating,
  "/docs/tokens/scopes": DocsTokensScopes,
  "/docs/tokens/cli-usage": DocsTokensCLIUsage,
};

function DocsRouter() {
  const [location] = useLocation();
  const canonicalPath = toCanonicalDocsPath(location);
  const Component = docsRouteMap[canonicalPath] ?? DocsNotFound;
  return <Component />;
}

function RouteSeo(props: Parameters<typeof usePageSeo>[0]) {
  usePageSeo(props);
  return null;
}

function PublicRouteFallback({ label = "Loading TraderClaw Skills" }: { label?: string }) {
  return (
    <PublicLayout>
      <RouteLoader label={label} />
    </PublicLayout>
  );
}

function App() {
  const { user, isLoading } = useAuth();
  const [location] = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const routeKey = isDocsSubdomain ? toCanonicalDocsPath(location) : location.split("?")[0] || "/";
  const isDocsRoute = isDocsSubdomain || location === "/docs" || location.startsWith("/docs/");
  const isLegalRoute =
    location === "/terms" ||
    location === "/terms-and-conditions" ||
    location === "/privacy" ||
    location === "/privacy-policy";

  let content;

  if (isLoading) {
    content = <RouteLoader fullscreen label="Loading TraderClaw Skills" />;
  } else if (isDocsRoute) {
    content = (
      <Suspense fallback={<RouteLoader fullscreen label="Loading Skills Docs" />}>
        <DocsLayoutProvider>
          <DocsRouter />
        </DocsLayoutProvider>
      </Suspense>
    );
  } else if (isLegalRoute) {
    content = (
      <Suspense fallback={<PublicRouteFallback label="Loading legal page" />}>
        <div key={routeKey} className="tc-page-stage">
          <Switch>
            <Route path="/terms">
              <PublicLayout><Terms /></PublicLayout>
            </Route>
            <Route path="/terms-and-conditions">
              <PublicLayout><Terms /></PublicLayout>
            </Route>
            <Route path="/privacy">
              <PublicLayout><Privacy /></PublicLayout>
            </Route>
            <Route path="/privacy-policy">
              <PublicLayout><Privacy /></PublicLayout>
            </Route>
          </Switch>
        </div>
      </Suspense>
    );
  } else if (!user) {
    content = (
      <Suspense fallback={<PublicRouteFallback />}>
        <div key={routeKey} className="tc-page-stage">
          <Switch>
            <Route path="/">
              <Landing />
            </Route>
            <Route path="/browse">
              <PublicLayout><Browse /></PublicLayout>
            </Route>
            <Route path="/skills/:owner/:slug">
              <PublicLayout><SkillDetail /></PublicLayout>
            </Route>
            <Route path="/skills/:owner">
              <PublicLayout><Profile /></PublicLayout>
            </Route>
            <Route path="/users/:handle">
              <PublicLayout><Profile /></PublicLayout>
            </Route>
            <Route path="/u/:handle">
              <PublicLayout><Profile /></PublicLayout>
            </Route>
            <Route>
              <PublicLayout><NotFound /></PublicLayout>
            </Route>
          </Switch>
        </div>
      </Suspense>
    );
  } else {
    content = (
      <div className="h-screen overflow-hidden bg-background">
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          mobileOpen={mobileMenuOpen}
          onMobileClose={() => setMobileMenuOpen(false)}
        />
        <div
          className={cn(
            "flex h-screen min-w-0 flex-col transition-[padding-left] duration-300 ease-out",
            sidebarCollapsed ? "lg:pl-20" : "lg:pl-[18rem]",
          )}
        >
          <Header
            mobileMenuOpen={mobileMenuOpen}
            mobileMenuButton={
              <MobileMenuButton
                open={mobileMenuOpen}
                onClick={() => setMobileMenuOpen((current) => !current)}
              />
            }
          />
          <main className="flex-1 overflow-y-auto">
            <div className="mx-auto w-full max-w-6xl px-4 py-5 sm:px-5 md:px-6 lg:px-8 lg:py-6 xl:py-8">
              <Suspense fallback={<RouteLoader label="Loading workspace" />}>
                <div key={routeKey} className="tc-page-stage">
                  <Switch>
                    <Route path="/" component={Home} />
                    <Route path="/browse" component={Browse} />
                    <Route path="/skills/:owner/:slug" component={SkillDetail} />
                    <Route path="/skills/:owner" component={Profile} />
                    <Route path="/new" component={CreateSkill} />
                    <Route path="/my-skills" component={MySkills} />
                    <Route path="/starred" component={Starred} />
                    <Route path="/validate" component={Validate} />
                    <Route path="/profile" component={Profile} />
                    <Route path="/settings" component={SettingsProfile} />
                    <Route path="/settings/tokens" component={SettingsTokens} />
                    <Route path="/settings/appearance" component={SettingsAppearance} />
                    <Route path="/settings/ai" component={SettingsAI} />
                    <Route path="/generate" component={AIGenerator} />
                    <Route path="/admin">
                      {(user as any)?.isAdmin ? (
                        <AdminDashboard />
                      ) : (
                        <>
                          <RouteSeo
                            title="Access Denied"
                            description="This TraderClaw Skills page is restricted and is not available for indexing."
                            canonicalPath="/admin"
                            robots="noindex,nofollow"
                          />
                          <div className="py-20 text-center">
                            <h1 className="text-2xl font-bold">Access Denied</h1>
                            <p className="mt-2 text-muted-foreground">You don&apos;t have permission to view this page.</p>
                          </div>
                        </>
                      )}
                    </Route>
                    <Route path="/users/:handle" component={Profile} />
                    <Route path="/u/:handle" component={Profile} />
                    <Route>
                      <NotFound />
                    </Route>
                  </Switch>
                </div>
              </Suspense>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <>
      {content}
      {!isLoading ? <CookieConsent /> : null}
      <Toaster />
    </>
  );
}

export default App;
