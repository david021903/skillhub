import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, Download, CheckCircle, Shield } from "lucide-react";

interface SkillCardProps {
  skill: {
    id: string;
    name: string;
    slug: string;
    description?: string | null;
    isVerified?: boolean | null;
    stars?: number | null;
    downloads?: number | null;
    tags?: string[] | null;
    validationScore?: number | null;
    owner: {
      id: string;
      handle?: string | null;
      firstName?: string | null;
      lastName?: string | null;
      profileImageUrl?: string | null;
    } | null;
  };
}

function getScoreColor(score: number): string {
  if (score >= 90) return "text-green-500";
  if (score >= 70) return "text-yellow-500";
  if (score >= 50) return "text-orange-500";
  return "text-red-500";
}

function getScoreBg(score: number): string {
  if (score >= 90) return "bg-green-500/10";
  if (score >= 70) return "bg-yellow-500/10";
  if (score >= 50) return "bg-orange-500/10";
  return "bg-red-500/10";
}

export default function SkillCard({ skill }: SkillCardProps) {
  const ownerHandle = skill.owner?.handle || skill.owner?.id;
  const isOfficial = skill.owner?.handle === "skillhub";
  const ownerName = skill.owner?.firstName 
    ? `${skill.owner.firstName} ${skill.owner.lastName || ""}`.trim()
    : skill.owner?.handle || "Unknown";

  const score = skill.validationScore;

  return (
    <Link href={`/skills/${ownerHandle}/${skill.slug}`}>
      <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-lg flex items-center gap-2">
                {skill.name}
                {skill.isVerified && (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                )}
              </CardTitle>
              <CardDescription className="mt-1 line-clamp-2">
                {skill.description || "No description provided"}
              </CardDescription>
            </div>
            {score != null && (
              <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-semibold shrink-0 ml-2 ${getScoreColor(score)} ${getScoreBg(score)}`}>
                <Shield className="h-3 w-3" />
                {score}%
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            {!isOfficial && (
              <div className="flex items-center gap-2">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={skill.owner?.profileImageUrl || undefined} />
                  <AvatarFallback className="text-xs">
                    {ownerName[0]}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm text-muted-foreground">{ownerName}</span>
              </div>
            )}
            {isOfficial && <div />}
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Star className="h-4 w-4" />
                {skill.stars || 0}
              </span>
              <span className="flex items-center gap-1">
                <Download className="h-4 w-4" />
                {skill.downloads || 0}
              </span>
            </div>
          </div>
          {skill.tags && skill.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-3">
              {skill.tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {skill.tags.length > 3 && (
                <Badge variant="secondary" className="text-xs">
                  +{skill.tags.length - 3}
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
