import { useState } from "react";
import { Route, Switch } from "wouter";
import { useAuth } from "./hooks/use-auth";
import { Toaster } from "./components/ui/toaster";
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

function App() {
  const { user, isLoading } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
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
      </div>
      <Toaster />
    </div>
  );
}

export default App;
