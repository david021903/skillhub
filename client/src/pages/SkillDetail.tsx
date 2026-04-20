import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SkillBadges, ValidationScore } from "@/components/SkillBadges";
import { DependencyGraph } from "@/components/DependencyGraph";
import { ActivityFeed } from "@/components/ActivityFeed";
import { SkillExplainer } from "@/components/SkillExplainer";
import { SkillChat } from "@/components/SkillChat";
import { SkillComments } from "@/components/SkillComments";
import { SkillTabs } from "@/components/SkillTabs";
import { CopyButton } from "@/components/CopyButton";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { toMetaDescription, usePageSeo } from "@/lib/seo";
import { Star, AlertCircle, RefreshCw, Github, GitFork, ArrowLeft, ChevronDown, CheckCircle2, AlertTriangle, XCircle, MinusCircle, Globe, Link2 } from "@/components/ui/icons";
import { useState } from "react";

export default function SkillDetail() {
  const [, params] = useRoute("/skills/:owner/:slug");
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showHealthDetails, setShowHealthDetails] = useState(false);

  const { data: skill, isLoading, error, refetch } = useQuery({
    queryKey: ["/api/skills", params?.owner, params?.slug],
    queryFn: async () => {
      const res = await fetch(`/api/skills/${params?.owner}/${params?.slug}`);
      if (!res.ok) throw new Error("Skill not found");
      return res.json();
    },
    enabled: !!params?.owner && !!params?.slug,
  });

  const { data: starStatus } = useQuery({
    queryKey: ["/api/skills", skill?.id, "starred"],
    queryFn: async () => {
      const res = await fetch(`/api/skills/${skill?.id}/starred`, { credentials: "include" });
      return res.json();
    },
    enabled: !!skill?.id && !!user,
  });

  const starMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/skills/${skill?.id}/star`, { method: "POST", credentials: "include" });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/skills", params?.owner, params?.slug] });
      queryClient.invalidateQueries({ queryKey: ["/api/skills", skill?.id, "starred"] });
    },
  });

  const openHomepageOrShare = async () => {
    if (skill?.homepage) {
      window.open(skill.homepage, "_blank", "noopener,noreferrer");
      return;
    }

    const shareUrl = window.location.href;
    await navigator.clipboard.writeText(shareUrl);
    toast({ title: "Copied!", description: "Skill link copied to clipboard" });
  };

  usePageSeo({
    title: skill?.name || "Skill Details",
    description: toMetaDescription(
      skill?.description
        ? `Install ${skill.name}, a TraderClaw skill by ${skill.owner?.handle || params?.owner || "the registry"}. ${skill.description}`
        : "Explore TraderClaw skill details, validation, versions, and install instructions from the official registry.",
    ),
    canonicalPath:
      params?.owner && params?.slug ? `/skills/${params.owner}/${params.slug}` : "/browse",
    robots: "index,follow",
  });

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="animate-pulse">
          <div className="h-10 bg-muted rounded w-1/2 mb-4"></div>
          <div className="h-6 bg-muted rounded w-3/4 mb-6"></div>
          <div className="h-4 bg-muted rounded w-1/4 mb-8"></div>
        </div>
        <Card className="animate-pulse">
          <CardContent className="p-6">
            <div className="h-6 bg-muted rounded w-1/4 mb-4"></div>
            <div className="h-12 bg-muted rounded"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-destructive mb-4" />
            <h3 className="text-lg font-semibold mb-2">Unable to load skill</h3>
            <p className="text-muted-foreground mb-4">
              This skill might not exist or there was an error loading it.
            </p>
            <Button onClick={() => refetch()} variant="outline" className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!skill) {
    return (
      <div className="text-center py-20">
        <h1 className="text-2xl font-bold">Skill not found</h1>
      </div>
    );
  }

  const latestVersion = skill.versions?.[0];
  const latestValidation = latestVersion?.validations?.[0];
  const isOfficial = skill.owner?.handle === "skillhub";
  const isOwnSkill = !!user && (String(skill.owner?.id || "") === String(user.id || "") || skill.owner?.handle === user.handle);
  const ownerName = skill.owner?.handle === "skillhub"
    ? "SkillHub"
    : skill.owner?.firstName 
      ? `${skill.owner.firstName} ${skill.owner.lastName || ""}`.trim()
      : skill.owner?.handle || "Unknown";
  const actionButtonClass =
    "h-11 w-11 border-border/80 bg-background/50 text-foreground transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/35 hover:bg-background disabled:pointer-events-none disabled:opacity-40";
  const starredActionButtonClass = starStatus?.starred
    ? "h-11 w-11 border-primary/85 bg-primary text-primary-foreground transition-all duration-200 hover:-translate-y-0.5 hover:border-primary hover:bg-primary/92 disabled:pointer-events-none disabled:opacity-40"
    : actionButtonClass;
  const detailTag = isOwnSkill ? "MY SKILL" : isOfficial ? "OFFICIAL SKILL" : "SKILL DETAIL";
  const installCommand = `shsc install ${params?.owner}/${params?.slug}@${latestVersion?.version || "latest"}`;
  const skillTagClassName =
    "border-primary/18 bg-black/20 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground";

  return (
    <div className="mx-auto max-w-6xl space-y-5 sm:space-y-6">
      <Button 
        variant="ghost" 
        size="sm" 
        className="mb-1 gap-2 self-start sm:mb-2" 
        onClick={() => window.history.back()}
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </Button>
      
      <section className="border border-border bg-card/40 p-5 sm:p-6 lg:p-8">
        <div className="flex flex-col gap-6 lg:gap-8 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-3xl flex-1">
            <span
              className="inline-flex items-center border border-primary/38 px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-primary"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              {detailTag}
            </span>
            <h1 className="mt-4 text-[2rem] leading-[1.02] text-foreground sm:text-4xl lg:text-5xl">{skill.name}</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:leading-7 md:text-base">
              {skill.description || "No description provided"}
            </p>

            <div className="mt-5">
              <SkillBadges
                skill={{
                  isVerified: skill.isVerified,
                  isArchived: skill.isArchived,
                  license: skill.license,
                  stars: skill.stars,
                  downloads: skill.downloads,
                  weeklyDownloads: skill.weeklyDownloads,
                  forks: skill.forks,
                  latestVersion: latestVersion ? {
                    version: latestVersion.version,
                    validation: latestValidation ? {
                      status: latestValidation.status,
                      score: latestValidation.score,
                    } : undefined,
                  } : undefined,
                }}
                showValidationBadge={false}
              />
            </div>

            <div className="mt-5 flex items-center gap-4 text-sm text-muted-foreground">
              <a href={`/users/${skill.owner?.handle}`} className="flex items-center gap-2 transition-colors hover:text-foreground">
                <Avatar className="h-7 w-7">
                  <AvatarImage src={skill.owner?.profileImageUrl || undefined} />
                  <AvatarFallback>{ownerName[0]}</AvatarFallback>
                </Avatar>
                <span className="font-mono text-xs">{ownerName}</span>
              </a>
            </div>
          </div>

          <div className="flex w-full flex-wrap items-start gap-2 sm:w-auto xl:justify-end">
            {user && (
              <Button
                variant="outline"
                size="icon"
                className={starredActionButtonClass}
                onClick={() => starMutation.mutate()}
                title={starStatus?.starred ? "Starred" : "Star"}
                aria-label={starStatus?.starred ? "Starred" : "Star"}
              >
                <Star className={`h-[1.05rem] w-[1.05rem] ${starStatus?.starred ? "fill-current" : ""}`} />
              </Button>
            )}
            <CopyButton
              text={installCommand}
              className={actionButtonClass}
              size="icon"
            />
            <Button
              variant={skill.repository ? "outline" : "ghost"}
              size="icon"
              className={actionButtonClass}
              onClick={() => {
                if (skill.repository) {
                  window.open(skill.repository, "_blank", "noopener,noreferrer");
                }
              }}
              title={skill.repository ? "Open repository" : "No repository linked"}
              aria-label={skill.repository ? "Open repository" : "No repository linked"}
              disabled={!skill.repository}
            >
              <Github className="h-[1.05rem] w-[1.05rem]" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className={actionButtonClass}
              onClick={openHomepageOrShare}
              title={skill.homepage ? "Open website" : "Copy share link"}
              aria-label={skill.homepage ? "Open website" : "Copy share link"}
            >
              {skill.homepage ? (
                <Globe className="h-[1.05rem] w-[1.05rem]" />
              ) : (
                <Link2 className="h-[1.05rem] w-[1.05rem]" />
              )}
            </Button>
          </div>
        </div>

        {skill.tags && skill.tags.length > 0 && (
          <div className="mt-6 flex flex-wrap gap-2 border-t border-primary/10 pt-5 sm:pt-6">
            {skill.tags.map((tag: string) => (
              <Badge key={tag} variant="outline" className={skillTagClassName}>
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </section>
      
      {latestValidation && latestValidation.score > 0 && (
        <Card className="border-primary/12">
          <button
            className="w-full text-left"
            onClick={() => setShowHealthDetails(!showHealthDetails)}
          >
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Health Score</CardTitle>
                <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${showHealthDetails ? "rotate-180" : ""}`} />
              </div>
            </CardHeader>
            <CardContent>
              <ValidationScore score={
                latestValidation.checks && (latestValidation.checks as any[]).length > 0
                  ? Math.round(((latestValidation.checks as any[]).filter((c: any) => c.status === "passed").length / (latestValidation.checks as any[]).length) * 100)
                  : latestValidation.score
              } />
            </CardContent>
          </button>
          {showHealthDetails && latestValidation.checks && (() => {
            const checks = latestValidation.checks as Array<{ id: string; category: string; status: string; message?: string }>;
            const statusOrder: Record<string, number> = { failed: 0, warning: 1, skipped: 2, passed: 3 };
            const sorted = [...checks].sort((a, b) => (statusOrder[a.status] ?? 2) - (statusOrder[b.status] ?? 2));
            const passed = checks.filter(c => c.status === "passed").length;
            const warnings = checks.filter(c => c.status === "warning").length;
            const failed = checks.filter(c => c.status === "failed").length;
            return (
              <CardContent className="pt-0 border-t">
                <div className="flex flex-wrap gap-4 pt-3 pb-2 text-[0.82rem] leading-6 text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500" />
                    <span>{passed} passed</span>
                  </span>
                  {warnings > 0 && (
                    <span className="flex items-center gap-1.5">
                      <AlertTriangle className="h-4 w-4 shrink-0 text-yellow-500" />
                      <span>{warnings} warnings</span>
                    </span>
                  )}
                  {failed > 0 && (
                    <span className="flex items-center gap-1.5">
                      <XCircle className="h-4 w-4 shrink-0 text-red-500" />
                      <span>{failed} failed</span>
                    </span>
                  )}
                </div>
                <div className="space-y-2">
                  {sorted.map((check) => (
                    <div key={check.id} className="flex items-start gap-2 text-sm">
                      {check.status === "passed" ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                      ) : check.status === "warning" ? (
                        <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 shrink-0" />
                      ) : check.status === "failed" ? (
                        <XCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                      ) : (
                        <MinusCircle className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                      )}
                      <div className="flex-1">
                        <span className={check.status === "passed" ? "text-muted-foreground" : check.status === "failed" ? "text-red-400" : check.status === "warning" ? "text-yellow-400" : ""}>
                          {check.message || check.id}
                        </span>
                        <span className="ml-2 text-xs text-muted-foreground/60">{check.category}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            );
          })()}
        </Card>
      )}

      <Card className="border-primary/12">
        <CardHeader>
          <CardTitle>Install</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3 rounded-[4px] border border-primary/12 bg-black/20 p-4 sm:flex-row sm:items-center sm:justify-between">
            <code className="max-w-full overflow-x-auto font-mono text-sm">
              shsc install {params?.owner}/{params?.slug}@{latestVersion?.version || "latest"}
            </code>
            <CopyButton text={installCommand} />
          </div>
        </CardContent>
      </Card>

      {skill.forkedFromId && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <GitFork className="h-4 w-4" />
          <span>Forked from another skill</span>
        </div>
      )}

      <SkillTabs skill={skill} owner={params?.owner || ""} slug={params?.slug || ""} />

      <DependencyGraph dependencies={skill.dependencies} skillName={skill.name} />

      {latestVersion?.skillMd && (
        <SkillExplainer skillMd={latestVersion.skillMd} />
      )}

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          {latestVersion?.skillMd && (
            <SkillChat skillMd={latestVersion.skillMd} skillName={skill.name} />
          )}
        </div>
        
        <div className="space-y-6">
          <ActivityFeed skillId={skill.id} />
        </div>
      </div>
      
      <div className="mt-8">
        <SkillComments skillId={skill.id} currentUserId={user?.id} />
      </div>
    </div>
  );
}
