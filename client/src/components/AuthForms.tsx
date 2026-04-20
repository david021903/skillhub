import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { Loader2, Chrome, Github } from "@/components/ui/icons";
import { useToast } from "@/hooks/use-toast";
import { FRONTEND_ONLY_PREVIEW } from "@/lib/frontend-only";

interface AuthFormsProps {
  defaultTab?: "login" | "register";
  onSuccess?: () => void;
}

export function AuthForms({ defaultTab = "login", onSuccess }: AuthFormsProps) {
  const { login, register, isLoggingIn, isRegistering } = useAuth();
  const { toast } = useToast();
  const [tab, setTab] = useState(defaultTab);
  
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [registerForm, setRegisterForm] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    handle: "",
    firstName: "",
    lastName: "",
  });

  useEffect(() => {
    setTab(defaultTab);
  }, [defaultTab]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(loginForm);
      toast({ title: "Welcome back!" });
      onSuccess?.();
    } catch (error: any) {
      toast({ title: "Login failed", description: error.message, variant: "destructive" });
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (registerForm.password !== registerForm.confirmPassword) {
      toast({ title: "Passwords don't match", variant: "destructive" });
      return;
    }
    try {
      await register({
        email: registerForm.email,
        password: registerForm.password,
        handle: registerForm.handle,
        firstName: registerForm.firstName,
        lastName: registerForm.lastName,
      });
      toast({ title: "Welcome to SkillHub!" });
      onSuccess?.();
    } catch (error: any) {
      toast({ title: "Registration failed", description: error.message, variant: "destructive" });
    }
  };

  const handlePreviewProviderLogin = async (provider: "google" | "github") => {
    if (FRONTEND_ONLY_PREVIEW) {
      try {
        await login({
          email: `preview+${provider}@skillhub.space`,
          password: "preview-mode",
        });
        toast({ title: `${provider === "google" ? "Google" : "GitHub"} preview sign-in ready` });
        onSuccess?.();
      } catch (error: any) {
        toast({ title: "Sign-in failed", description: error.message, variant: "destructive" });
      }
      return;
    }

    window.location.href = provider === "google" ? "/api/auth/google" : "/api/auth/github";
  };

  return (
    <div className="w-full bg-card">
      <Tabs value={tab} onValueChange={(v) => setTab(v as "login" | "register")}>
        <div className="border-b border-border/80 p-4 sm:p-5">
          <TabsList className="grid w-full grid-cols-2 border border-border bg-muted/15">
            <TabsTrigger value="login" className="text-[11px] uppercase tracking-[0.16em]" style={{ fontFamily: "var(--font-mono)" }}>
              Sign In
            </TabsTrigger>
            <TabsTrigger value="register" className="text-[11px] uppercase tracking-[0.16em]" style={{ fontFamily: "var(--font-mono)" }}>
              Create Account
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="p-4 sm:p-5">
          <TabsContent value="login" className="mt-0">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-email">Email</Label>
                <Input
                  id="login-email"
                  type="email"
                  placeholder="you@example.com"
                  value={loginForm.email}
                  onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="login-password">Password</Label>
                <Input
                  id="login-password"
                  type="password"
                  placeholder="Enter your password"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoggingIn}>
                {isLoggingIn ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Sign In
              </Button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center">
                <span
                  className="bg-card px-2 text-[10px] uppercase tracking-[0.16em] text-muted-foreground"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  Or continue with
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button type="button" variant="outline" className="w-full" onClick={() => handlePreviewProviderLogin("google")}>
                <Chrome className="h-4 w-4 mr-2" />
                Google
              </Button>
              <Button type="button" variant="outline" className="w-full" onClick={() => handlePreviewProviderLogin("github")}>
                <Github className="h-4 w-4 mr-2" />
                GitHub
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="register" className="mt-0">
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    placeholder="John"
                    value={registerForm.firstName}
                    onChange={(e) => setRegisterForm({ ...registerForm, firstName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    placeholder="Doe"
                    value={registerForm.lastName}
                    onChange={(e) => setRegisterForm({ ...registerForm, lastName: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="handle">Username</Label>
                <Input
                  id="handle"
                  placeholder="johndoe"
                  value={registerForm.handle}
                  onChange={(e) => setRegisterForm({ ...registerForm, handle: e.target.value })}
                  required
                  minLength={3}
                  maxLength={30}
                  pattern="[a-zA-Z0-9_-]+"
                />
                <p className="text-xs text-muted-foreground">Letters, numbers, underscores, hyphens only</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="reg-email">Email</Label>
                <Input
                  id="reg-email"
                  type="email"
                  placeholder="you@example.com"
                  value={registerForm.email}
                  onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reg-password">Password</Label>
                <Input
                  id="reg-password"
                  type="password"
                  placeholder="Min 8 chars, upper, lower, number"
                  value={registerForm.password}
                  onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                  required
                  minLength={8}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Repeat password"
                  value={registerForm.confirmPassword}
                  onChange={(e) => setRegisterForm({ ...registerForm, confirmPassword: e.target.value })}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={isRegistering}>
                {isRegistering ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Create Account
              </Button>
            </form>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
