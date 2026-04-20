import type { ReactNode, KeyboardEvent } from "react";
import { useLocation } from "wouter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Download, Shield, Star } from "@/components/ui/icons";
import { getSkillValidationBadgeClasses } from "@/lib/skill-validation";

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
  headerAction?: ReactNode;
}

export default function SkillCard({ skill, headerAction }: SkillCardProps) {
  const [, setLocation] = useLocation();
  const ownerHandle = skill.owner?.handle || skill.owner?.id;
  const href = `/skills/${ownerHandle}/${skill.slug}`;
  const authorName = skill.owner?.firstName
    ? `${skill.owner.firstName} ${skill.owner.lastName || ""}`.trim()
    : skill.owner?.handle
      ? `@${skill.owner.handle}`
      : "Unknown author";
  const visibleTags = skill.tags?.slice(0, 3) || [];
  const hiddenTagCount = Math.max(0, (skill.tags?.length || 0) - visibleTags.length);
  const validationScore = skill.validationScore == null
    ? null
    : Math.max(0, Math.min(100, Math.round(skill.validationScore)));
  const authorInitials = skill.owner?.firstName?.[0] || skill.owner?.handle?.[0]?.toUpperCase() || "U";
  const handleOpen = () => setLocation(href);
  const tagClassName =
    "inline-flex items-center border border-primary/18 bg-black/20 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground";
  const handleCardKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleOpen();
    }
  };

  return (
    <Card
      className="tc-panel-hover h-full cursor-pointer border-primary/10 bg-card/95 transition-colors"
      role="link"
      tabIndex={0}
      onClick={handleOpen}
      onKeyDown={handleCardKeyDown}
    >
      <CardContent className="flex h-full flex-col p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h3 className="line-clamp-2 text-lg text-foreground md:text-xl">
              {skill.name}
            </h3>
            <p className="mt-2 line-clamp-2 max-w-[44ch] text-sm leading-6 text-muted-foreground">
              {skill.description || "No description provided"}
            </p>
            <div className="mt-3 flex items-center gap-2.5 text-sm text-muted-foreground">
              <Avatar className="h-6 w-6 shrink-0 border-0 bg-transparent">
                <AvatarImage src={skill.owner?.profileImageUrl || undefined} alt={authorName} />
                <AvatarFallback className="bg-primary/10 text-[11px] text-primary">
                  {authorInitials}
                </AvatarFallback>
              </Avatar>
              <span className="truncate">{authorName}</span>
            </div>
            {visibleTags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {visibleTags.map((tag) => (
                  <span
                    key={tag}
                    className={tagClassName}
                  >
                    {tag}
                  </span>
                ))}
                {hiddenTagCount > 0 && (
                  <span className={tagClassName}>
                    +{hiddenTagCount}
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="flex shrink-0 flex-col items-end gap-2">
            <div className="flex min-h-[1.9rem] items-start justify-end">
              {validationScore != null ? (
                <span
                  className={`inline-flex shrink-0 items-center gap-1 border px-2.5 py-1 text-[10px] uppercase tracking-[0.16em] ${getSkillValidationBadgeClasses(validationScore)}`}
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  <Shield className="h-3.5 w-3.5" />
                  {validationScore}%
                </span>
              ) : skill.isVerified ? (
                <span
                  className={`inline-flex shrink-0 items-center gap-1 border px-2.5 py-1 text-[10px] uppercase tracking-[0.16em] ${getSkillValidationBadgeClasses(100)}`}
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  <Shield className="h-3.5 w-3.5" />
                  Verified
                </span>
              ) : null}
            </div>
            <div className="flex min-h-9 items-start justify-end">
              {headerAction ? <div className="relative z-10 flex h-9 w-9 items-center justify-center">{headerAction}</div> : null}
            </div>
          </div>
        </div>

        <div className="mt-auto flex items-end justify-end pt-5">
          <div
            className="flex items-center gap-4 text-[11px] text-muted-foreground"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            <span className="inline-flex items-center gap-1.5 tabular-nums text-foreground/88">
              <Star className="h-3.5 w-3.5 text-primary" />
              {(skill.stars || 0).toLocaleString()}
            </span>
            <span className="inline-flex items-center gap-1.5 tabular-nums text-foreground/88">
              <Download className="h-3.5 w-3.5 text-primary" />
              {(skill.downloads || 0).toLocaleString()}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
