import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageIntro } from "@/components/PageIntro";
import { SkillFilterBar, type SkillSort } from "@/components/SkillFilterBar";
import SkillCard from "@/components/SkillCard";
import { usePageSeo } from "@/lib/seo";
import { AlertCircle, Package, RefreshCw, Star } from "@/components/ui/icons";

export default function Starred() {
  const [location, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const params = useMemo(() => new URLSearchParams(location.split("?")[1] || ""), [location]);
  const searchParam = params.get("q") || params.get("search") || "";
  const tagParam = params.get("tag") || "";
  const sort = (params.get("sort") as SkillSort) || "latest";

  const setStarredParams = (updates: Record<string, string | null>) => {
    const next = new URLSearchParams(location.split("?")[1] || "");
    Object.entries(updates).forEach(([key, value]) => {
      if (!value || value === "latest") {
        next.delete(key);
      } else {
        next.set(key, value);
      }
    });
    const query = next.toString();
    setLocation(query ? `/starred?${query}` : "/starred");
  };

  usePageSeo({
    title: "Starred Skills",
    description:
      "Review the TraderClaw skills you have starred so they are easy to revisit, compare, and install later.",
    canonicalPath: "/starred",
    robots: "noindex,nofollow",
  });

  const { data: starredSkills = [], isLoading, error, refetch } = useQuery({
    queryKey: ["/api/my-stars"],
    queryFn: async () => {
      const res = await fetch("/api/my-stars", { credentials: "include" });
      if (!res.ok) {
        if (res.status === 401) return [];
        throw new Error("Failed to fetch starred skills");
      }
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

  const tagOptions = useMemo(() => {
    const tags = starredSkills.flatMap((skill: any) => (Array.isArray(skill.tags) ? skill.tags : []));
    return Array.from(new Set(tags.map((tag: string) => tag.trim()).filter(Boolean))).sort((left, right) =>
      left.localeCompare(right),
    );
  }, [starredSkills]);

  const filteredSkills = useMemo(() => {
    const normalizedSearch = searchParam.trim().toLowerCase();
    const normalizedTag = tagParam.trim().toLowerCase();

    let nextSkills = [...starredSkills];

    if (normalizedTag) {
      nextSkills = nextSkills.filter((skill: any) =>
        (skill.tags || []).some((candidate: string) => candidate.toLowerCase() === normalizedTag),
      );
    }

    if (normalizedSearch) {
      nextSkills = nextSkills.filter((skill: any) => {
        const haystack = [
          skill.name,
          skill.slug,
          skill.description,
          ...(skill.tags || []),
        ]
          .join(" ")
          .toLowerCase();

        return haystack.includes(normalizedSearch);
      });
    }

    nextSkills.sort((left: any, right: any) => {
      if (sort === "stars") {
        return (right.stars || 0) - (left.stars || 0);
      }

      if (sort === "downloads") {
        return (right.downloads || 0) - (left.downloads || 0);
      }

      const rightDate = new Date(right.updatedAt || right.updated_at || right.createdAt || right.created_at || 0).getTime();
      const leftDate = new Date(left.updatedAt || left.updated_at || left.createdAt || left.created_at || 0).getTime();
      return rightDate - leftDate;
    });

    return nextSkills;
  }, [starredSkills, searchParam, tagParam, sort]);

  const starredResultsLabel = tagParam && searchParam
    ? `${filteredSkills.length} results for ${tagParam} / ${searchParam}`
    : tagParam
      ? `${filteredSkills.length} skills in ${tagParam}`
      : searchParam
        ? `Searching for ${searchParam}`
        : `${filteredSkills.length} skills saved`;

  return (
    <div className="max-w-6xl space-y-8">
      <PageIntro
        tag="STARRED SKILLS"
        title="Your Starred Skills"
        description="Keep the TraderClaw skills you want to revisit, compare, or install close at hand."
      />

      {!error && starredSkills.length > 0 && (
        <SkillFilterBar
          search={searchParam}
          onSearchChange={(value) => setStarredParams({ q: value || null })}
          tagValue={tagParam}
          onTagChange={(value) => setStarredParams({ tag: value || null })}
          sort={sort}
          onSortChange={(value) => setStarredParams({ sort: value === "latest" ? null : value })}
          tagOptions={tagOptions}
          resultsLabel={starredResultsLabel}
        />
      )}

      {error ? (
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-destructive mb-4" />
            <h3 className="text-lg font-semibold mb-2">Unable to load starred skills</h3>
            <p className="text-muted-foreground mb-4">
              Something went wrong. Please try again.
            </p>
            <Button onClick={() => refetch()} variant="outline" className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Retry
            </Button>
          </CardContent>
        </Card>
      ) : isLoading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="h-6 bg-muted rounded mb-2 w-3/4"></div>
                <div className="h-4 bg-muted rounded mb-4 w-full"></div>
                <div className="h-4 bg-muted rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : starredSkills.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredSkills.map((skill: any) => (
            <SkillCard
              key={skill.id}
              skill={skill}
              headerAction={
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
              }
            />
          ))}
          {filteredSkills.length === 0 && (
            <Card className="col-span-full">
              <CardContent className="py-20 text-center">
                <Package className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                <h3 className="text-lg font-semibold text-foreground">No matching skills</h3>
                <p className="mt-2 text-muted-foreground">
                  Try a different search, tag, or sort to find one of your saved skills.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        <section className="border border-border bg-card/45">
          <div className="flex flex-col items-center px-6 py-16 text-center md:px-10 md:py-20">
            <div className="flex h-16 w-16 items-center justify-center border border-primary/25 bg-primary/8">
              <Star className="h-8 w-8 fill-current text-primary" />
            </div>
            <h2 className="mt-6 text-2xl text-foreground md:text-3xl">No Starred Skills Yet</h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground md:text-base">
              Star TraderClaw skills you want to revisit, compare, or install later and they will appear here.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link href="/browse">
                <Button className="gap-2">
                  <Package className="h-4 w-4" />
                  Browse Skills
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
