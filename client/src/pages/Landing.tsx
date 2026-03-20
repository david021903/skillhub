import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Package, GitBranch, Shield, Terminal, Star, Zap, Bot, User, Copy, Check, Flame } from "lucide-react";
import { AuthForms } from "@/components/AuthForms";
import SkillCard from "@/components/SkillCard";

export default function Landing() {
  const [viewMode, setViewMode] = useState<"human" | "agent">("human");
  const [copied, setCopied] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);

  const { data: stats } = useQuery({
    queryKey: ["/api/stats"],
    queryFn: async () => {
      const res = await fetch("/api/stats");
      if (!res.ok) return { skills: 0, versions: 0, downloads: 0 };
      return res.json();
    },
  });

  const { data: trendingSkills = [], isLoading: trendingLoading } = useQuery({
    queryKey: ["/api/skills/trending"],
    queryFn: async () => {
      const res = await fetch("/api/skills/trending?limit=6");
      if (!res.ok) return [];
      return res.json();
    },
  });

  const { data: latestSkills = [], isLoading: latestLoading } = useQuery({
    queryKey: ["/api/skills", "latest"],
    queryFn: async () => {
      const res = await fetch("/api/skills?sort=latest&limit=6");
      if (!res.ok) return [];
      return res.json();
    },
  });

  const { data: popularSkills = [], isLoading: popularLoading } = useQuery({
    queryKey: ["/api/skills", "popular"],
    queryFn: async () => {
      const res = await fetch("/api/skills?sort=stars&limit=6");
      if (!res.ok) return [];
      return res.json();
    },
  });

  const copyCommand = () => {
    navigator.clipboard.writeText("curl -s https://skillhub.space/skill.md");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <nav className="fixed top-0 w-full z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-6">
            <img src="/logo-dark.png" alt="SkillHub" className="h-8 dark:invert" />
            <Link href="/browse" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Browse Skills
            </Link>
            <a href="https://docs.skillhub.space" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Docs
            </a>
          </div>
          <Dialog open={authOpen} onOpenChange={setAuthOpen}>
            <DialogTrigger asChild>
              <Button>Sign In</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md p-0 overflow-hidden">
              <AuthForms onSuccess={() => setAuthOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
      </nav>

      <main className="pt-16">
        <section className="container px-4 py-20 md:py-32">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-medium mb-6">
              <Zap className="h-4 w-4" />
              The OpenClaw Skills Registry
            </div>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
              Discover, Share & Install
              <span className="text-primary block mt-2">Agent Skills</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              SkillHub is GitHub for AI agent skills. Browse verified skills, publish your own, 
              and supercharge your OpenClaw agents with one-command installs.
            </p>
            <div className="flex justify-center mb-6">
              <div className="inline-flex rounded-lg border bg-muted p-1">
                <button
                  onClick={() => setViewMode("human")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    viewMode === "human"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <User className="h-4 w-4" />
                  I'm a Human
                </button>
                <button
                  onClick={() => setViewMode("agent")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    viewMode === "agent"
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Bot className="h-4 w-4" />
                  I'm an Agent
                </button>
              </div>
            </div>

            {viewMode === "human" ? (
              <>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button size="lg" className="w-full sm:w-auto gap-2" onClick={() => setAuthOpen(true)}>
                    Get Started Free
                  </Button>
                  <Button size="lg" variant="outline" className="gap-2">
                    <Terminal className="h-4 w-4" />
                    npm install -g shsc
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground mt-4">
                  Free forever. No credit card required.
                </p>
              </>
            ) : (
              <div className="max-w-lg mx-auto">
                <div className="bg-zinc-900 rounded-lg p-4 text-left border border-zinc-700">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 text-zinc-400 text-sm">
                      <Terminal className="h-4 w-4" />
                      <span>Terminal</span>
                    </div>
                    <button
                      onClick={copyCommand}
                      className="text-zinc-400 hover:text-white transition-colors"
                    >
                      {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                    </button>
                  </div>
                  <code className="text-green-400 font-mono text-sm">
                    curl -s https://skillhub.space/skill.md
                  </code>
                </div>
                <div className="mt-6 text-left space-y-3">
                  <p className="text-sm text-muted-foreground flex items-start gap-3">
                    <span className="bg-primary/20 text-primary rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shrink-0">1</span>
                    Run the command above to get started
                  </p>
                  <p className="text-sm text-muted-foreground flex items-start gap-3">
                    <span className="bg-primary/20 text-primary rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shrink-0">2</span>
                    Follow the skill instructions to authenticate
                  </p>
                  <p className="text-sm text-muted-foreground flex items-start gap-3">
                    <span className="bg-primary/20 text-primary rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shrink-0">3</span>
                    Discover, install, and publish skills!
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>

        <section className="container px-4 py-20">
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <Card className="border-2 hover:border-primary/50 transition-colors">
              <CardContent className="p-6">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Package className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Browse & Discover</h3>
                <p className="text-muted-foreground text-sm">
                  Explore verified skills from the community. Filter by category, platform, 
                  or requirements to find exactly what you need.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-colors">
              <CardContent className="p-6">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <GitBranch className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Version Control</h3>
                <p className="text-muted-foreground text-sm">
                  Publish versioned releases with semantic versioning. Roll back anytime, 
                  track changes, and maintain compatibility.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-colors">
              <CardContent className="p-6">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Validated & Secure</h3>
                <p className="text-muted-foreground text-sm">
                  Every skill is automatically validated for security, compatibility, 
                  and best practices before publishing.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="container px-4 py-12 text-center">
          <div className="flex justify-center gap-12">
            <div className="text-center">
              <div className="text-4xl font-bold text-primary">{stats?.skills || "1000"}+</div>
              <div className="text-sm text-muted-foreground">Skills Published</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary">{stats?.versions || "1000"}+</div>
              <div className="text-sm text-muted-foreground">Versions</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary">{stats?.downloads ? `${Math.floor(stats.downloads / 1000)}K` : "1K"}+</div>
              <div className="text-sm text-muted-foreground">Downloads</div>
            </div>
          </div>
        </section>

        {/* Skills Gallery */}
        <section className="container px-4 py-12">
          {trendingSkills.length > 0 && (
            <div className="mb-12">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <Flame className="h-6 w-6 text-orange-500" />
                  Trending This Week
                </h2>
                <Link href="/browse">
                  <Button variant="ghost" size="sm">View All</Button>
                </Link>
              </div>
              {trendingLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[...Array(3)].map((_, i) => (
                    <Card key={i} className="animate-pulse">
                      <CardContent className="p-4">
                        <div className="h-6 bg-muted rounded mb-2 w-3/4"></div>
                        <div className="h-4 bg-muted rounded mb-4 w-full"></div>
                        <div className="h-4 bg-muted rounded w-1/2"></div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {trendingSkills.map((skill: any) => (
                    <SkillCard key={skill.id} skill={skill} />
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Latest Skills</h2>
              <Link href="/browse?sort=latest">
                <Button variant="ghost" size="sm">View All</Button>
              </Link>
            </div>
            {latestLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-4">
                      <div className="h-6 bg-muted rounded mb-2 w-3/4"></div>
                      <div className="h-4 bg-muted rounded mb-4 w-full"></div>
                      <div className="h-4 bg-muted rounded w-1/2"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {latestSkills.map((skill: any) => (
                  <SkillCard key={skill.id} skill={skill} />
                ))}
              </div>
            )}
          </div>

          <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Star className="h-6 w-6 text-yellow-500" />
                Popular Skills
              </h2>
              <Link href="/browse?sort=stars">
                <Button variant="ghost" size="sm">View All</Button>
              </Link>
            </div>
            {popularLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-4">
                      <div className="h-6 bg-muted rounded mb-2 w-3/4"></div>
                      <div className="h-4 bg-muted rounded mb-4 w-full"></div>
                      <div className="h-4 bg-muted rounded w-1/2"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {popularSkills.map((skill: any) => (
                  <SkillCard key={skill.id} skill={skill} />
                ))}
              </div>
            )}
          </div>
        </section>

        <footer className="border-t bg-muted/30 py-8">
          <div className="container px-4 text-center text-sm text-muted-foreground flex items-center justify-center gap-3">
            <p>&copy; 2026 SkillHub. All rights reserved. Created by 0BL1V1ON AI</p>
            <a href="https://x.com/skillhubspace" target="_blank" rel="noopener noreferrer" className="text-muted-foreground/60 hover:text-foreground transition-colors" aria-label="Follow us on X">
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            </a>
          </div>
        </footer>
      </main>
    </div>
  );
}
