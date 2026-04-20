import { type ReactNode, useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageIntro } from "@/components/PageIntro";
import SkillCard from "@/components/SkillCard";
import { usePageSeo } from "@/lib/seo";
import { Package, Plus, Star, TrendingUp } from "@/components/ui/icons";

const DASHBOARD_NUMBER_FORMAT = new Intl.NumberFormat("en-US");

function getTimeGreeting() {
  const hour = new Date().getHours();

  if (hour < 12) return "Morning";
  if (hour < 18) return "Afternoon";
  return "Evening";
}

function formatDashboardStat(value: number | null | undefined) {
  return DASHBOARD_NUMBER_FORMAT.format(value || 0);
}

function SectionTag({ children }: { children: string }) {
  return (
    <span
      className="inline-flex items-center border border-primary/62 px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-primary shadow-[inset_0_0_0_1px_rgba(249,55,40,0.08)]"
      style={{ fontFamily: "var(--font-mono)" }}
    >
      {children}
    </span>
  );
}

interface DashboardSkillSectionProps {
  tag: string;
  title: string;
  description: string;
  href?: string;
  hrefLabel?: string;
  skills: any[];
  isLoading: boolean;
  emptyText: string;
  headerAction?: (skill: any) => ReactNode;
}

function DashboardSkillSection({
  tag,
  title,
  description,
  href,
  hrefLabel = "View All",
  skills,
  isLoading,
  emptyText,
  headerAction,
}: DashboardSkillSectionProps) {
  return (
    <section className="space-y-5 lg:space-y-6">
      <div className="flex items-start justify-between gap-5">
        <div className="min-w-0">
          <SectionTag>{tag}</SectionTag>
          <h2 className="mt-4 text-2xl text-foreground md:text-[2rem]">{title}</h2>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-muted-foreground md:text-base">
            {description}
          </p>
        </div>
        {href ? (
          <Link
            href={href}
            className="shrink-0 pt-2 text-[11px] uppercase tracking-[0.16em] text-primary underline decoration-primary/55 underline-offset-4 transition-colors hover:text-primary/80"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            {hrefLabel}
          </Link>
        ) : null}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[...Array(3)].map((_, index) => (
            <Card key={index} className="animate-pulse">
              <CardContent className="space-y-3 p-5">
                <div className="h-7 w-3/4 rounded bg-muted" />
                <div className="h-4 w-full rounded bg-muted" />
                <div className="h-4 w-5/6 rounded bg-muted" />
                <div className="h-6 w-32 rounded bg-muted" />
                <div className="h-5 w-44 rounded bg-muted" />
                <div className="flex justify-end gap-4 pt-5">
                  <div className="h-4 w-14 rounded bg-muted" />
                  <div className="h-4 w-16 rounded bg-muted" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : skills.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {skills.map((skill: any) => (
            <SkillCard
              key={skill.id}
              skill={skill}
              headerAction={headerAction ? headerAction(skill) : undefined}
            />
          ))}
        </div>
      ) : (
        <section className="border border-border bg-card/45">
          <div className="px-6 py-10 text-sm leading-7 text-muted-foreground md:px-8">
            {emptyText}
          </div>
        </section>
      )}
    </section>
  );
}

export default function Home() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [timeGreeting, setTimeGreeting] = useState(() => getTimeGreeting());
  const firstName = user?.firstName || user?.email?.split("@")[0] || "Operator";

  usePageSeo({
    title: "Dashboard",
    description:
      "Monitor trending skills, new releases, and registry activity from the TraderClaw Skills operator dashboard.",
    canonicalPath: "/",
    robots: "noindex,nofollow",
  });

  useEffect(() => {
    const updateGreeting = () => setTimeGreeting(getTimeGreeting());

    updateGreeting();
    const intervalId = window.setInterval(updateGreeting, 60_000);

    return () => window.clearInterval(intervalId);
  }, []);

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/stats"],
    queryFn: async () => {
      const res = await fetch("/api/stats");
      if (!res.ok) return { skills: 0, versions: 0, downloads: 0 };
      return res.json();
    },
  });

  const { data: recentSkills = [], isLoading: recentLoading } = useQuery({
    queryKey: ["/api/skills", "latest"],
    queryFn: async () => {
      const res = await fetch("/api/skills?sort=latest&limit=6");
      if (!res.ok) return [];
      return res.json();
    },
  });

  const { data: starredSkills = [], isLoading: starredLoading } = useQuery({
    queryKey: ["/api/my-stars", "dashboard"],
    queryFn: async () => {
      const res = await fetch("/api/my-stars?limit=6", { credentials: "include" });
      if (!res.ok) {
        if (res.status === 401) return [];
        return [];
      }
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

  const toggleStarMutation = useMutation({
    mutationFn: async (skillId: string) => {
      const res = await fetch(`/api/skills/${skillId}/star`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) {
        throw new Error("Failed to update star");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/my-stars"] });
      queryClient.invalidateQueries({ queryKey: ["/api/skills"] });
    },
  });

  return (
    <div className="space-y-12 lg:space-y-14 xl:space-y-16">
      <section>
        <PageIntro
          tag="DASHBOARD"
          title={`Good ${timeGreeting}, ${firstName}!`}
          description="Official TraderClaw Skills registry."
          actions={
            <>
              <Link href="/new">
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Create New Skill
                </Button>
              </Link>
              <Link href="/browse">
                <Button variant="outline" className="gap-2">
                  <Package className="h-4 w-4" />
                  Browse Skills
                </Button>
              </Link>
            </>
          }
        />
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="tc-kicker text-primary/60">Skills</div>
              <Package className="h-7 w-7 shrink-0 text-primary/85 md:h-8 md:w-8" style={{ strokeWidth: 1.6 }} />
            </div>
            <div className="mt-7">
              {statsLoading ? (
                <div className="h-8 w-16 animate-pulse rounded bg-muted" />
              ) : (
                <p className="font-mono text-3xl text-foreground">{formatDashboardStat(stats?.skills)}</p>
              )}
              <p className="mt-1 text-sm text-muted-foreground">Published in registry</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="tc-kicker text-primary/60">Versions</div>
              <Star className="h-7 w-7 shrink-0 text-primary/85 md:h-8 md:w-8" style={{ strokeWidth: 1.6 }} />
            </div>
            <div className="mt-7">
              {statsLoading ? (
                <div className="h-8 w-16 animate-pulse rounded bg-muted" />
              ) : (
                <p className="font-mono text-3xl text-foreground">{formatDashboardStat(stats?.versions)}</p>
              )}
              <p className="mt-1 text-sm text-muted-foreground">Versioned releases shipped</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="tc-kicker text-primary/60">Downloads</div>
              <TrendingUp className="h-7 w-7 shrink-0 text-primary/85 md:h-8 md:w-8" style={{ strokeWidth: 1.6 }} />
            </div>
            <div className="mt-7">
              {statsLoading ? (
                <div className="h-8 w-16 animate-pulse rounded bg-muted" />
              ) : (
                <p className="font-mono text-3xl text-foreground">{formatDashboardStat(stats?.downloads)}</p>
              )}
              <p className="mt-1 text-sm text-muted-foreground">Install activity tracked</p>
            </div>
          </CardContent>
        </Card>
      </section>

      <DashboardSkillSection
        tag="NEWEST SKILLS"
        title="Newest Skills"
        description="Fresh releases from the official TraderClaw registry."
        href="/browse"
        skills={recentSkills}
        isLoading={recentLoading}
        emptyText="Newly published skills will appear here as soon as they land."
      />

      {!starredLoading && starredSkills.length > 0 ? (
        <DashboardSkillSection
          tag="YOUR STARRED"
          title="Your Starred"
          description="Pinned registry entries you can revisit or remove directly from the dashboard."
          href="/starred"
          skills={starredSkills}
          isLoading={false}
          emptyText=""
          headerAction={(skill) => (
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 shrink-0 border-primary/80 bg-primary p-0 text-primary-foreground hover:border-primary hover:bg-primary/92"
              title="Remove from starred"
              aria-label="Remove from starred"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                toggleStarMutation.mutate(skill.id);
              }}
              disabled={toggleStarMutation.isPending && toggleStarMutation.variables === skill.id}
            >
              <Star className="h-4 w-4 fill-current" />
            </Button>
          )}
        />
      ) : null}

      <DashboardSkillSection
        tag="TRENDING SKILLS"
        title="Trending This Week"
        description="Skills with the most attention and activity across the registry right now."
        href="/browse?sort=stars"
        skills={trendingSkills}
        isLoading={trendingLoading}
        emptyText="Trending TraderClaw Skills will appear here as soon as activity starts coming in."
      />
    </div>
  );
}
