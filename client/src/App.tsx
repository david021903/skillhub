import { Route, Switch } from "wouter";
import { useAuth } from "./hooks/use-auth";
import { Toaster } from "./components/ui/toaster";
import Header from "./components/Header";
import Landing from "./pages/Landing";
import Home from "./pages/Home";
import Browse from "./pages/Browse";
import SkillDetail from "./pages/SkillDetail";
import CreateSkill from "./pages/CreateSkill";
import MySkills from "./pages/MySkills";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";

function App() {
  const { user, isLoading } = useAuth();

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
        <Landing />
        <Toaster />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/browse" component={Browse} />
          <Route path="/skills/:owner/:slug" component={SkillDetail} />
          <Route path="/new" component={CreateSkill} />
          <Route path="/my-skills" component={MySkills} />
          <Route path="/profile" component={Profile} />
          <Route path="/settings" component={Settings} />
          <Route path="/u/:handle" component={Profile} />
          <Route>
            <div className="text-center py-20">
              <h1 className="text-2xl font-bold">404 - Not Found</h1>
            </div>
          </Route>
        </Switch>
      </main>
      <Toaster />
    </div>
  );
}

export default App;
