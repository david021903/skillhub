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
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Star, Copy, ExternalLink, AlertCircle, RefreshCw, Github, GitFork } from "lucide-react";

export default function SkillDetail() {
  const [, params] = useRoute("/skills/:owner/:slug");
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

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

  const copyInstall = () => {
    const version = skill?.versions?.[0]?.version || "latest";
    navigator.clipboard.writeText(`shsc install ${params?.owner}/${params?.slug}@${version}`);
    toast({ title: "Copied!", description: "Install command copied to clipboard" });
  };

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
  const ownerName = skill.owner?.firstName 
    ? `${skill.owner.firstName} ${skill.owner.lastName || ""}`.trim()
    : skill.owner?.handle || "Unknown";

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row gap-6 items-start">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold">{skill.name}</h1>
          </div>
          <p className="text-lg text-muted-foreground mb-4">
            {skill.description || "No description provided"}
          </p>
          
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
          />
          
          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-4">
            <a href={`/users/${skill.owner?.handle}`} className="flex items-center gap-2 hover:text-foreground transition-colors">
              <Avatar className="h-6 w-6">
                <AvatarImage src={skill.owner?.profileImageUrl || undefined} />
                <AvatarFallback>{ownerName[0]}</AvatarFallback>
              </Avatar>
              <span>{ownerName}</span>
            </a>
          </div>
        </div>
        <div className="flex flex-col gap-2 w-full md:w-auto">
          {user && (
            <Button
              variant={starStatus?.starred ? "default" : "outline"}
              className="gap-2"
              onClick={() => starMutation.mutate()}
            >
              <Star className={`h-4 w-4 ${starStatus?.starred ? "fill-current" : ""}`} />
              {starStatus?.starred ? "Starred" : "Star"}
            </Button>
          )}
          <Button variant="outline" className="gap-2" onClick={copyInstall}>
            <Copy className="h-4 w-4" />
            Copy Install
          </Button>
          {skill.repository && (
            <Button variant="outline" className="gap-2" asChild>
              <a href={skill.repository} target="_blank" rel="noopener noreferrer">
                <Github className="h-4 w-4" />
                Repository
              </a>
            </Button>
          )}
          {skill.homepage && (
            <Button variant="outline" className="gap-2" asChild>
              <a href={skill.homepage} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4" />
                Homepage
              </a>
            </Button>
          )}
        </div>
      </div>

      {skill.tags && skill.tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {skill.tags.map((tag: string) => (
            <Badge key={tag} variant="secondary">{tag}</Badge>
          ))}
        </div>
      )}
      
      {latestValidation && latestValidation.score > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Health Score</CardTitle>
          </CardHeader>
          <CardContent>
            <ValidationScore score={latestValidation.score} />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Install</CardTitle>
        </CardHeader>
        <CardContent>
          <code className="block bg-muted p-4 rounded-lg font-mono text-sm">
            shsc install {params?.owner}/{params?.slug}@{latestVersion?.version || "latest"}
          </code>
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

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
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
