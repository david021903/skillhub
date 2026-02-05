import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertTriangle, XCircle, Download, Star, GitFork, Scale, Activity, Shield, Clock } from "lucide-react";

interface SkillBadgesProps {
  skill: {
    isVerified?: boolean;
    isArchived?: boolean;
    license?: string;
    stars?: number;
    downloads?: number;
    weeklyDownloads?: number;
    forks?: number;
    latestVersion?: {
      version?: string;
      validation?: {
        status?: string;
        score?: number;
      };
    };
  };
  size?: "sm" | "md";
}

export function SkillBadges({ skill, size = "md" }: SkillBadgesProps) {
  const validation = skill.latestVersion?.validation;
  const iconSize = size === "sm" ? "h-3 w-3" : "h-4 w-4";
  
  const getValidationBadge = () => {
    if (!validation) return null;
    
    switch (validation.status) {
      case "passed":
        return (
          <Badge variant="default" className="bg-green-500 hover:bg-green-600 gap-1">
            <CheckCircle className={iconSize} />
            Validated
          </Badge>
        );
      case "warning":
        return (
          <Badge variant="default" className="bg-yellow-500 hover:bg-yellow-600 gap-1">
            <AlertTriangle className={iconSize} />
            Warnings
          </Badge>
        );
      case "failed":
        return (
          <Badge variant="destructive" className="gap-1">
            <XCircle className={iconSize} />
            Failed
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" className="gap-1">
            <Clock className={iconSize} />
            Pending
          </Badge>
        );
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {skill.isVerified && (
        <Badge variant="default" className="bg-blue-500 hover:bg-blue-600 gap-1">
          <Shield className={iconSize} />
          Verified
        </Badge>
      )}
      
      {skill.isArchived && (
        <Badge variant="secondary" className="gap-1">
          Archived
        </Badge>
      )}
      
      {getValidationBadge()}
      
      {skill.latestVersion?.version && (
        <Badge variant="outline" className="gap-1">
          v{skill.latestVersion.version}
        </Badge>
      )}
      
      {skill.license && (
        <Badge variant="outline" className="gap-1">
          <Scale className={iconSize} />
          {skill.license}
        </Badge>
      )}
      
      {(skill.stars ?? 0) > 0 && (
        <Badge variant="outline" className="gap-1">
          <Star className={iconSize} />
          {skill.stars}
        </Badge>
      )}
      
      {(skill.downloads ?? 0) > 0 && (
        <Badge variant="outline" className="gap-1">
          <Download className={iconSize} />
          {skill.downloads?.toLocaleString()}
        </Badge>
      )}
      
      {(skill.weeklyDownloads ?? 0) > 0 && (
        <Badge variant="outline" className="gap-1 text-green-600">
          <Activity className={iconSize} />
          {skill.weeklyDownloads}/wk
        </Badge>
      )}
      
      {(skill.forks ?? 0) > 0 && (
        <Badge variant="outline" className="gap-1">
          <GitFork className={iconSize} />
          {skill.forks}
        </Badge>
      )}
    </div>
  );
}

interface ValidationScoreProps {
  score: number;
  maxScore?: number;
}

export function ValidationScore({ score, maxScore = 100 }: ValidationScoreProps) {
  const percentage = Math.round((score / maxScore) * 100);
  const color = percentage >= 80 ? "bg-green-500" : percentage >= 60 ? "bg-yellow-500" : "bg-red-500";
  
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
        <div className={`h-full ${color} transition-all`} style={{ width: `${percentage}%` }} />
      </div>
      <span className="text-sm font-medium">{score}/{maxScore}</span>
    </div>
  );
}
