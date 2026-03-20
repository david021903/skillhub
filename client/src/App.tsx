import { useState } from "react";
import { Route, Switch, useLocation } from "wouter";
import { useAuth } from "./hooks/use-auth";
import { Toaster } from "./components/ui/toaster";
import { isDocsSubdomain, toCanonicalDocsPath } from "./components/DocsLayout";
import Header from "./components/Header";
import Sidebar, { MobileMenuButton } from "./components/Sidebar";
import { PublicLayout } from "./components/PublicLayout";
import Landing from "./pages/Landing";
import Home from "./pages/Home";
import Browse from "./pages/Browse";
import SkillDetail from "./pages/SkillDetail";
import CreateSkill from "./pages/CreateSkill";
import MySkills from "./pages/MySkills";
import Profile from "./pages/Profile";
import SettingsProfile from "./pages/SettingsProfile";
import SettingsTokens from "./pages/SettingsTokens";
import SettingsAppearance from "./pages/SettingsAppearance";
import SettingsAI from "./pages/SettingsAI";
import Starred from "./pages/Starred";
import Validate from "./pages/Validate";
import AIGenerator from "./pages/AIGenerator";
import AdminDashboard from "./pages/AdminDashboard";

import DocsGettingStarted from "./pages/docs/GettingStarted";
import DocsQuickStart from "./pages/docs/QuickStart";
import DocsAccount from "./pages/docs/Account";
import DocsSkillFormat from "./pages/docs/SkillFormat";
import DocsSkillFormatFrontmatter from "./pages/docs/SkillFormatFrontmatter";
import DocsSkillFormatBody from "./pages/docs/SkillFormatBody";
import DocsSkillFormatExamples from "./pages/docs/SkillFormatExamples";
import DocsPlatform from "./pages/docs/Platform";
import DocsPlatformPublishing from "./pages/docs/PlatformPublishing";
import DocsPlatformVersions from "./pages/docs/PlatformVersions";
import DocsPlatformCollaboration from "./pages/docs/PlatformCollaboration";
import DocsPlatformForking from "./pages/docs/PlatformForking";
import DocsCLI from "./pages/docs/CLI";
import DocsCLIAuth from "./pages/docs/CLIAuth";
import DocsCLIPublishInstall from "./pages/docs/CLIPublishInstall";
import DocsCLISearch from "./pages/docs/CLISearch";
import DocsCLIValidation from "./pages/docs/CLIValidation";
import DocsCLITemplates from "./pages/docs/CLITemplates";
import DocsCLIDependencies from "./pages/docs/CLIDependencies";
import DocsValidation from "./pages/docs/Validation";
import DocsValidationCriteria from "./pages/docs/ValidationCriteria";
import DocsValidationImproving from "./pages/docs/ValidationImproving";
import DocsAI from "./pages/docs/AI";
import DocsAIExplainer from "./pages/docs/AIExplainer";
import DocsAIGenerator from "./pages/docs/AIGenerator";
import DocsAIChat from "./pages/docs/AIChat";
import DocsTokens from "./pages/docs/Tokens";
import DocsTokensCreating from "./pages/docs/TokensCreating";
import DocsTokensScopes from "./pages/docs/TokensScopes";
import DocsTokensCLIUsage from "./pages/docs/TokensCLIUsage";

const docsRouteMap: Record<string, React.ComponentType> = {
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
  const Component = docsRouteMap[canonicalPath] || DocsGettingStarted;
  return <Component />;
}

function App() {
  const { user, isLoading } = useAuth();
  const [location] = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (isDocsSubdomain || location === "/docs" || location.startsWith("/docs/")) {
    return (
      <>
        <DocsRouter />
        <Toaster />
      </>
    );
  }

  if (!user) {
    return (
      <>
        <Switch>
          <Route path="/browse">
            <PublicLayout><Browse /></PublicLayout>
          </Route>
          <Route path="/skills/:owner/:slug">
            {(params) => <PublicLayout><SkillDetail /></PublicLayout>}
          </Route>
          <Route path="/skills/:owner">
            {(params) => <PublicLayout><Profile /></PublicLayout>}
          </Route>
          <Route path="/users/:handle">
            {(params) => <PublicLayout><Profile /></PublicLayout>}
          </Route>
          <Route path="/u/:handle">
            {(params) => <PublicLayout><Profile /></PublicLayout>}
          </Route>
          <Route component={Landing} />
        </Switch>
        <Toaster />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        mobileOpen={mobileMenuOpen}
        onMobileClose={() => setMobileMenuOpen(false)}
      />
      <div className="flex-1 flex flex-col min-h-screen">
        <Header 
          mobileMenuButton={
            <MobileMenuButton onClick={() => setMobileMenuOpen(true)} />
          }
        />
        <main className="flex-1 container mx-auto px-4 py-8">
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
              {(user as any)?.isAdmin ? <AdminDashboard /> : (
                <div className="text-center py-20">
                  <h1 className="text-2xl font-bold">Access Denied</h1>
                  <p className="text-muted-foreground mt-2">You don't have permission to view this page.</p>
                </div>
              )}
            </Route>
            <Route path="/users/:handle" component={Profile} />
            <Route path="/u/:handle" component={Profile} />
            <Route>
              <div className="text-center py-20">
                <h1 className="text-2xl font-bold">404 - Not Found</h1>
              </div>
            </Route>
          </Switch>
        </main>
        <footer className="border-t bg-muted/30 py-8 mt-auto">
          <div className="container px-4 text-center text-sm text-muted-foreground flex items-center justify-center gap-3">
            <p>&copy; 2026 SkillHub. All rights reserved. Created by 0BL1V1ON AI</p>
            <a href="https://x.com/skillhubspace" target="_blank" rel="noopener noreferrer" className="text-muted-foreground/60 hover:text-foreground transition-colors" aria-label="Follow us on X">
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            </a>
          </div>
        </footer>
      </div>
      <Toaster />
    </div>
  );
}

export default App;
