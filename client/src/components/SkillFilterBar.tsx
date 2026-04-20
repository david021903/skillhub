import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search } from "@/components/ui/icons";
import { cn } from "@/lib/utils";
import { Reveal } from "@/components/Reveal";

export type SkillSort = "latest" | "stars" | "downloads";

export const skillSortOptions: { value: SkillSort; label: string }[] = [
  { value: "latest", label: "Latest" },
  { value: "stars", label: "Popular" },
  { value: "downloads", label: "Most Downloaded" },
];

interface SkillFilterBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  tagValue: string;
  onTagChange: (value: string) => void;
  sort: SkillSort;
  onSortChange: (value: SkillSort) => void;
  tagOptions: string[];
  resultsLabel: string;
  className?: string;
}

export function SkillFilterBar({
  search,
  onSearchChange,
  tagValue,
  onTagChange,
  sort,
  onSortChange,
  tagOptions,
  resultsLabel,
  className,
}: SkillFilterBarProps) {
  const [searchValue, setSearchValue] = useState(search);

  useEffect(() => {
    setSearchValue(search);
  }, [search]);

  useEffect(() => {
    if (searchValue === search) return;

    const timeoutId = window.setTimeout(() => {
      onSearchChange(searchValue);
    }, 220);

    return () => window.clearTimeout(timeoutId);
  }, [onSearchChange, search, searchValue]);

  return (
    <Reveal delay={80} className={cn("w-full max-w-6xl", className)}>
      <div className="border border-border bg-card/40 px-4 py-4 sm:px-5 sm:py-5 lg:px-6 lg:py-6">
        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-[minmax(0,1.45fr)_240px_auto] xl:items-end">
          <div className="space-y-2 lg:col-span-2 xl:col-span-1">
            <div
              className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground sm:text-[10px]"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              Search
            </div>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search skills, tags, descriptions..."
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
                className="h-12 border-border/70 bg-card/60 pl-12 pr-4 text-sm text-foreground placeholder:text-muted-foreground/80 focus-visible:border-primary/35 focus-visible:ring-primary/20 sm:text-base lg:h-14"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div
              className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground sm:text-[10px]"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              By Tag
            </div>
            <Select value={tagValue || "all"} onValueChange={(value) => onTagChange(value === "all" ? "" : value)}>
              <SelectTrigger
                className="h-12 border-border/70 bg-card/60 px-4 text-[11px] uppercase tracking-[0.16em] lg:h-14"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                <SelectValue placeholder="ALL TAGS" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  <span className="uppercase tracking-[0.16em]" style={{ fontFamily: "var(--font-mono)" }}>
                    ALL TAGS
                  </span>
                </SelectItem>
                {tagOptions.map((tag) => (
                  <SelectItem key={tag} value={tag}>
                    <span className="uppercase tracking-[0.16em]" style={{ fontFamily: "var(--font-mono)" }}>
                      {tag}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 lg:col-span-2 xl:col-span-1">
            <div
              className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground sm:text-[10px]"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              Sort
            </div>
            <div className="flex flex-wrap gap-2 xl:justify-end">
              {skillSortOptions.map((option) => {
                const isActive = option.value === sort;

                return (
                  <Button
                    key={option.value}
                    type="button"
                    variant={isActive ? "default" : "outline"}
                    size="sm"
                    aria-pressed={isActive}
                    className={cn(
                      "h-12 min-w-0 flex-1 basis-[calc(50%-0.25rem)] px-4 text-sm sm:basis-auto sm:flex-initial sm:min-w-[132px] sm:px-5 lg:h-14",
                      isActive
                        ? "border-primary bg-primary text-primary-foreground shadow-[0_0_0_1px_rgba(249,55,40,0.16)] hover:border-primary hover:bg-primary/92"
                        : "border-border/70 bg-card/30 text-muted-foreground hover:border-primary/28 hover:bg-primary/6 hover:text-foreground",
                    )}
                    onClick={() => onSortChange(option.value)}
                  >
                    {option.label}
                  </Button>
                );
              })}
            </div>
          </div>

          <div
            className="mt-1 text-[9px] uppercase tracking-[0.2em] text-muted-foreground sm:text-[10px] lg:col-span-2 xl:col-span-3"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            {resultsLabel}
          </div>
        </div>
      </div>
    </Reveal>
  );
}
