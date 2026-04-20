import { Badge } from "@/components/ui/badge";
import { AlertTriangle, XCircle, Download, Star, GitFork, Scale, Activity, Shield, Clock } from "@/components/ui/icons";
import { cn } from "@/lib/utils";
import {
  getSkillValidationBadgeClasses,
  getSkillValidationBarClasses,
  getSkillValidationPercentage,
} from "@/lib/skill-validation";

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
  showValidationBadge?: boolean;
}

export function SkillBadges({ skill, size = "md", showValidationBadge = true }: SkillBadgesProps) {
  const validation = skill.latestVersion?.validation;
  const iconSize = size === "sm" ? "h-3 w-3" : "h-4 w-4";
  const validationScore = validation?.score == null
    ? null
    : Math.max(0, Math.min(100, Math.round(validation.score)));
  
  const getValidationBadge = () => {
    if (!validation) return null;

    if (validationScore != null) {
      return (
        <Badge
          variant="outline"
          className={cn(
            "gap-1 border font-mono text-[10px] uppercase tracking-[0.16em]",
            getSkillValidationBadgeClasses(validationScore),
          )}
        >
          <Shield className={iconSize} />
          {validationScore}%
        </Badge>
      );
    }
    
    switch (validation.status) {
      case "passed":
        return (
          <Badge
            variant="outline"
            className={cn(
              "gap-1 border font-mono text-[10px] uppercase tracking-[0.16em]",
              getSkillValidationBadgeClasses(100),
            )}
          >
            <Shield className={iconSize} />
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
        <Badge
          variant="outline"
          className={cn(
            "gap-1 border font-mono text-[10px] uppercase tracking-[0.16em]",
            getSkillValidationBadgeClasses(100),
          )}
        >
          <Shield className={iconSize} />
          Verified
        </Badge>
      )}
      
      {skill.isArchived && (
        <Badge variant="secondary" className="gap-1">
          Archived
        </Badge>
      )}
      
      {showValidationBadge ? getValidationBadge() : null}
      
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
  const percentage = getSkillValidationPercentage(score, maxScore);
  
  return (
    <div className="flex items-center gap-3">
      <div className="h-2 flex-1 overflow-hidden bg-muted">
        <div
          className={cn("h-full transition-all", getSkillValidationBarClasses(percentage))}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span
        className={cn(
          "inline-flex shrink-0 items-center gap-1.5 border px-2.5 py-1 text-[10px] uppercase tracking-[0.16em]",
          getSkillValidationBadgeClasses(percentage),
        )}
        style={{ fontFamily: "var(--font-mono)" }}
      >
        <Shield className="h-3.5 w-3.5" />
        {percentage}%
      </span>
    </div>
  );
}
