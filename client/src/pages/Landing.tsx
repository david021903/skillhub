import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Package, GitBranch, Shield, Terminal, Star, Users, Zap } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <nav className="fixed top-0 w-full z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-lg">🦞</span>
            </div>
            <span className="font-bold text-xl">SkillBook</span>
          </div>
          <a href="/api/login">
            <Button>Sign In</Button>
          </a>
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
              SkillBook is GitHub for AI agent skills. Browse verified skills, publish your own, 
              and supercharge your OpenClaw agents with one-command installs.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="/api/login">
                <Button size="lg" className="w-full sm:w-auto gap-2">
                  Get Started Free
                </Button>
              </a>
              <Button size="lg" variant="outline" className="gap-2">
                <Terminal className="h-4 w-4" />
                skillbook install &lt;skill&gt;
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              Free forever. No credit card required.
            </p>
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

        <section className="container px-4 py-20 text-center">
          <h2 className="text-3xl font-bold mb-4">Join the Community</h2>
          <p className="text-muted-foreground mb-8">
            Start sharing your skills with developers worldwide.
          </p>
          <div className="flex justify-center gap-12">
            <div className="text-center">
              <div className="text-4xl font-bold text-primary">100+</div>
              <div className="text-sm text-muted-foreground">Skills Published</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary">500+</div>
              <div className="text-sm text-muted-foreground">Developers</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary">1K+</div>
              <div className="text-sm text-muted-foreground">Downloads</div>
            </div>
          </div>
        </section>

        <footer className="border-t bg-muted/30 py-8">
          <div className="container px-4 text-center text-sm text-muted-foreground">
            <p>&copy; 2025 SkillBook. Built for the OpenClaw community.</p>
          </div>
        </footer>
      </main>
    </div>
  );
}
