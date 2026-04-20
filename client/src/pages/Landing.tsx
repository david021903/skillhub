import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { PublicHeader } from "@/components/PublicHeader";
import { PublicFooter } from "@/components/PublicFooter";
import SkillCard from "@/components/SkillCard";
import { Button } from "@/components/ui/button";
import { usePageSeo } from "@/lib/seo";
import {
  Check,
  Flame,
  GitBranch,
  Package,
  Shield,
  Terminal,
} from "@/components/ui/icons";

const featureBlocks = [
  {
    icon: Package,
    title: "Discover",
    body: "Explore official TraderClaw Skills in a clean registry with clearer metadata and faster scanning.",
  },
  {
    icon: GitBranch,
    title: "Version",
    body: "Track releases and updates with sharper change visibility so installs stay aligned across teams.",
  },
  {
    icon: Shield,
    title: "Trust",
    body: "Work from trusted validation signals and structured registry details before you install anything.",
  },
];

export default function Landing() {
  const [viewMode, setViewMode] = useState<"human" | "agent">("human");
  const [copied, setCopied] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [authDefaultTab, setAuthDefaultTab] = useState<"login" | "register">("login");

  const installCommand = "npm install -g tcs";

  const openAuth = (tab: "login" | "register" = "login") => {
    setAuthDefaultTab(tab);
    setAuthOpen(true);
  };

  usePageSeo({
    title: "Official Skill Registry",
    description:
      "Discover, share, validate, and install official TraderClaw skills for operators, builders, and AI agents.",
    canonicalPath: "/",
    robots: "index,follow",
  });

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
      const res = await fetch("/api/skills/trending?limit=3");
      if (!res.ok) return [];
      return res.json();
    },
  });

  const copyCommand = async () => {
    await navigator.clipboard.writeText(installCommand);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <PublicHeader
        authOpen={authOpen}
        authDefaultTab={authDefaultTab}
        onAuthOpenChange={setAuthOpen}
        onOpenAuth={openAuth}
      />

      <main className="px-4 pb-14 pt-10 md:pb-16 md:pt-14">
        <section className="mx-auto flex max-w-5xl flex-col items-center text-center">
          <div
            className="inline-flex items-center border border-primary/35 px-4 py-2 text-[11px] uppercase tracking-[0.18em] text-primary"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            Official TraderClaw Skills
          </div>

          <h1 className="mt-6 max-w-4xl text-4xl md:text-6xl">
            Discover, Share &amp; Install Agent Skills
          </h1>

          <p className="mt-5 max-w-2xl text-base leading-8 text-muted-foreground md:text-lg">
            Official TraderClaw Skills for operators and agents. Discover trusted packages,
            publish faster, and install from one sharp registry surface built for the TraderClaw ecosystem.
          </p>

          <div className="mt-8 inline-flex border border-border bg-card/40 p-1">
            <button
              type="button"
              aria-pressed={viewMode === "human"}
              onClick={() => setViewMode("human")}
              className={`px-5 py-2 text-[11px] uppercase tracking-[0.18em] transition-colors ${
                viewMode === "human"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              style={{ fontFamily: "var(--font-mono)" }}
            >
              I&apos;m a Human
            </button>
            <button
              type="button"
              aria-pressed={viewMode === "agent"}
              onClick={() => setViewMode("agent")}
              className={`px-5 py-2 text-[11px] uppercase tracking-[0.18em] transition-colors ${
                viewMode === "agent"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              style={{ fontFamily: "var(--font-mono)" }}
            >
              I&apos;m an Agent
            </button>
          </div>

          <p className="mt-4 max-w-xl text-sm leading-7 text-muted-foreground">
            {viewMode === "human"
              ? "Publish, browse, and install official TraderClaw Skills with a cleaner operator workflow."
              : "Bootstrap faster from terminal and keep your agent environment aligned with official TraderClaw Skills."}
          </p>

          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
            <Button size="lg" className="min-w-[220px]" onClick={() => openAuth("register")}>
              Get Started for Free
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="min-w-[220px] gap-2"
              onClick={copyCommand}
            >
              {copied ? <Check className="h-4 w-4" /> : <Terminal className="h-4 w-4" />}
              {copied ? "Copied" : installCommand}
            </Button>
          </div>

          <p className="mt-4 text-sm text-muted-foreground">
            Free forever. Part of TraderClaw.
          </p>
        </section>

        <section className="mx-auto mt-12 grid max-w-6xl gap-4 md:grid-cols-3">
          {featureBlocks.map(({ icon: Icon, title, body }) => (
            <div key={title} className="tc-panel px-5 py-6 text-left">
              <Icon className="h-5 w-5 text-primary" />
              <h2
                className="mt-4 text-[11px] uppercase tracking-[0.18em] text-foreground"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                {title}
              </h2>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">{body}</p>
            </div>
          ))}
        </section>

        <section className="mx-auto mt-8 grid max-w-6xl gap-4 sm:grid-cols-3">
          {[
            { label: "Skills", value: stats?.skills || 0 },
            { label: "Versions", value: stats?.versions || 0 },
            { label: "Downloads", value: stats?.downloads || 0 },
          ].map((item) => (
            <div key={item.label} className="border border-primary/12 bg-black/20 px-5 py-5 text-center">
              <div
                className="text-[10px] uppercase tracking-[0.2em] text-primary/70"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                {item.label}
              </div>
              <div className="mt-3 font-mono text-4xl text-foreground">{item.value}</div>
            </div>
          ))}
        </section>

        <section className="mx-auto mt-12 max-w-6xl">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <div
                className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                Live Signal
              </div>
              <h2 className="mt-2 flex items-center gap-2 text-2xl text-foreground">
                <Flame className="h-5 w-5 text-primary" />
                Trending This Week
              </h2>
            </div>
            <Link href="/browse?sort=stars">
              <Button variant="outline" size="sm">
                View All
              </Button>
            </Link>
          </div>

          {trendingLoading ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="tc-panel animate-pulse p-5">
                  <div className="h-3 w-24 bg-muted" />
                  <div className="mt-3 h-7 w-3/4 bg-muted" />
                  <div className="mt-3 h-4 w-full bg-muted" />
                  <div className="mt-2 h-4 w-5/6 bg-muted" />
                </div>
              ))}
            </div>
          ) : trendingSkills.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {trendingSkills.map((skill: any) => (
                <SkillCard key={skill.id} skill={skill} />
              ))}
            </div>
          ) : (
            <div className="tc-panel px-6 py-8 text-center text-muted-foreground">
              Trending TraderClaw Skills will appear here as soon as activity starts coming in.
            </div>
          )}
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
