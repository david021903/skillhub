import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageIntro } from "@/components/PageIntro";
import { SkillFilterBar, type SkillSort } from "@/components/SkillFilterBar";
import SkillCard from "@/components/SkillCard";
import { useAuth } from "@/hooks/use-auth";
import { usePageSeo } from "@/lib/seo";
import { pluralize } from "@/lib/utils";
import { Plus, Package, AlertCircle, RefreshCw } from "@/components/ui/icons";

export default function MySkills() {
  const [location, setLocation] = useLocation();
  const { user } = useAuth();
  const params = useMemo(() => new URLSearchParams(location.split("?")[1] || ""), [location]);
  const searchParam = params.get("q") || params.get("search") || "";
  const tagParam = params.get("tag") || "";
  const sort = (params.get("sort") as SkillSort) || "latest";

  const setMySkillsParams = (updates: Record<string, string | null>) => {
    const next = new URLSearchParams(location.split("?")[1] || "");
    Object.entries(updates).forEach(([key, value]) => {
      if (!value || value === "latest") {
        next.delete(key);
      } else {
        next.set(key, value);
      }
    });
    const query = next.toString();
    setLocation(query ? `/my-skills?${query}` : "/my-skills");
  };

  usePageSeo({
    title: "My Skills",
    description:
      "Manage your published TraderClaw skills, review registry entries, and launch new skill releases.",
    canonicalPath: "/my-skills",
    robots: "noindex,nofollow",
  });

  const { data: skills = [], isLoading, error, refetch } = useQuery({
    queryKey: ["/api/my-skills"],
    queryFn: async () => {
      const res = await fetch("/api/my-skills", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch skills");
      return res.json();
    },
  });

  const tagOptions = useMemo(() => {
    const tags = skills.flatMap((skill: any) => (Array.isArray(skill.tags) ? skill.tags : []));
    return Array.from(new Set(tags.map((tag: string) => tag.trim()).filter(Boolean))).sort((left, right) =>
      left.localeCompare(right),
    );
  }, [skills]);

  const filteredSkills = useMemo(() => {
    const normalizedSearch = searchParam.trim().toLowerCase();
    const normalizedTag = tagParam.trim().toLowerCase();

    let nextSkills = [...skills];

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
  }, [skills, searchParam, tagParam, sort]);

  const mySkillsResultsLabel = tagParam && searchParam
    ? `${filteredSkills.length} results for ${tagParam} / ${searchParam}`
    : tagParam
      ? `${filteredSkills.length} ${pluralize(filteredSkills.length, "skill")} in ${tagParam}`
      : searchParam
        ? `Searching for ${searchParam}`
        : `${filteredSkills.length} ${pluralize(filteredSkills.length, "skill")} available`;

  return (
    <div className="max-w-6xl space-y-8">
      <PageIntro
        tag="MY SKILLS"
        title="Manage Your Skills"
        description="Review your published skills, track updates, and create new registry entries."
        actions={
          <Link href="/new">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Create New Skill
            </Button>
          </Link>
        }
      />

      {!error && skills.length > 0 && (
        <SkillFilterBar
          search={searchParam}
          onSearchChange={(value) => setMySkillsParams({ q: value || null })}
          tagValue={tagParam}
          onTagChange={(value) => setMySkillsParams({ tag: value || null })}
          sort={sort}
          onSortChange={(value) => setMySkillsParams({ sort: value === "latest" ? null : value })}
          tagOptions={tagOptions}
          resultsLabel={mySkillsResultsLabel}
        />
      )}

      {error ? (
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-destructive mb-4" />
            <h3 className="text-lg font-semibold mb-2">Unable to load skills</h3>
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
      ) : skills.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSkills.map((skill: any) => (
            <SkillCard
              key={skill.id}
              skill={{
                ...skill,
                owner: {
                  id: user?.id || "",
                  handle: user?.handle,
                  firstName: user?.firstName,
                  lastName: user?.lastName,
                  profileImageUrl: user?.profileImageUrl,
                },
              }}
            />
          ))}
          {filteredSkills.length === 0 && (
            <Card className="col-span-full">
              <CardContent className="py-20 text-center">
                <Package className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                <h3 className="text-lg font-semibold text-foreground">No matching skills</h3>
                <p className="mt-2 text-muted-foreground">
                  Try a different search, tag, or sort to find one of your published skills.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        <section className="border border-border bg-card/45">
          <div className="flex flex-col items-center px-6 py-16 text-center md:px-10 md:py-20">
            <div className="flex h-16 w-16 items-center justify-center border border-primary/25 bg-primary/8">
              <Package className="h-8 w-8 text-primary" style={{ strokeWidth: 1.7 }} />
            </div>
            <h2 className="mt-6 text-2xl text-foreground md:text-3xl">No Skills Yet</h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground md:text-base">
              You haven&apos;t published a skill yet. Start your first TraderClaw skill and make it available in the registry.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link href="/new">
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Create First Skill
                </Button>
              </Link>
              <Link href="/browse">
                <Button variant="outline">Browse Skills</Button>
              </Link>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
