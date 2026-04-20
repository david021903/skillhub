import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageIntro } from "@/components/PageIntro";
import { SkillFilterBar, type SkillSort } from "@/components/SkillFilterBar";
import { toMetaDescription, usePageSeo } from "@/lib/seo";
import { pluralize } from "@/lib/utils";
import SkillCard from "@/components/SkillCard";
import { AlertCircle, ChevronLeft, ChevronRight, Package, RefreshCw } from "@/components/ui/icons";

const ITEMS_PER_PAGE = 12;

export default function Browse() {
  const [location, setLocation] = useLocation();
  const params = useMemo(() => new URLSearchParams(location.split("?")[1] || ""), [location]);

  const searchParam = params.get("q") || params.get("search") || "";
  const tagParam = params.get("tag") || "";
  const sort = (params.get("sort") as SkillSort) || "latest";
  const page = Math.max(1, Number.parseInt(params.get("page") || "1", 10) || 1);

  const setBrowseParams = (updates: Record<string, string | null>) => {
    const next = new URLSearchParams(location.split("?")[1] || "");
    Object.entries(updates).forEach(([key, value]) => {
      if (!value || value === "latest") {
        next.delete(key);
      } else {
        next.set(key, value);
      }
    });
    const query = next.toString();
    setLocation(query ? `/browse?${query}` : "/browse");
  };

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["/api/skills", searchParam, tagParam, sort, page],
    queryFn: async () => {
      const query = new URLSearchParams({
        sort,
        limit: String(ITEMS_PER_PAGE),
        offset: String((page - 1) * ITEMS_PER_PAGE),
        paginated: "true",
      });
      if (searchParam) query.set("search", searchParam);
      if (tagParam) query.set("tag", tagParam);
      const res = await fetch(`/api/skills?${query}`);
      if (!res.ok) {
        throw new Error("Failed to load skills. Please try again.");
      }
      return res.json();
    },
  });

  const { data: tagCatalog = [] } = useQuery({
    queryKey: ["/api/skills", "tag-catalog"],
    queryFn: async () => {
      const res = await fetch("/api/skills?sort=latest&limit=250");
      if (!res.ok) return [];
      return res.json();
    },
  });

  const skills = data?.skills || [];
  const total = data?.total || 0;
  const totalPages = Math.max(1, Math.ceil(total / ITEMS_PER_PAGE));
  const tagOptions = useMemo(() => {
    const tags = tagCatalog.flatMap((skill: any) => (Array.isArray(skill.tags) ? skill.tags : []));
    return Array.from(new Set(tags.map((tag: string) => tag.trim()).filter(Boolean))).sort((left, right) =>
      left.localeCompare(right),
    );
  }, [tagCatalog]);

  const seoTitle = searchParam
    ? `Search Results for "${searchParam}"`
    : tagParam
      ? `${tagParam} Skills`
      : sort === "stars"
        ? "Trending Skills"
        : sort === "downloads"
          ? "Most Downloaded Skills"
          : "Browse Skills";

  const seoDescription = searchParam
    ? toMetaDescription(
        `Search TraderClaw Skills for ${searchParam} and compare validation, stars, downloads, and official registry details on skills.traderclaw.ai.`,
      )
    : tagParam
      ? toMetaDescription(
          `Browse TraderClaw Skills tagged ${tagParam} and discover the strongest skills in that category across the official registry.`,
        )
      : toMetaDescription(
          "Browse official TraderClaw Skills by category, popularity, downloads, trending momentum, and the latest releases in the registry.",
        );

  const seoCanonicalPath =
    searchParam || tagParam || page > 1
      ? location
      : sort === "stars" || sort === "downloads"
        ? `/browse?sort=${sort}`
        : "/browse";

  usePageSeo({
    title: seoTitle,
    description: seoDescription,
    canonicalPath: seoCanonicalPath,
    robots: searchParam || tagParam || page > 1 ? "noindex,follow" : "index,follow",
  });

  const intro = searchParam
    ? {
        tag: "SEARCH RESULTS",
        title: `Results for "${searchParam}"`,
        description:
          "Refine the registry with search, category tags, and sorting to quickly find the right TraderClaw skill.",
      }
    : tagParam
      ? {
          tag: "CATEGORY FILTER",
          title: `${tagParam} Skills`,
          description:
            "Browse the TraderClaw registry inside this category and compare the strongest matching skills by popularity, downloads, or recency.",
        }
      : sort === "stars"
        ? {
            tag: "TRENDING",
            title: "Trending TraderClaw Skills",
            description:
              "See the skills gaining the most attention right now and sort through the registry by category, popularity, and recent activity.",
          }
        : sort === "downloads"
          ? {
              tag: "MOST DOWNLOADED",
              title: "Most Downloaded Skills",
              description:
                "Explore the TraderClaw skills with the strongest install momentum and refine the list with search and category filters.",
            }
          : {
              tag: "BROWSE SKILLS",
              title: "Explore TraderClaw Skills",
              description:
                "Search the registry, filter by category tags, and sort the strongest skills by what is newest, most popular, or downloaded the most.",
            };

  return (
    <div className="max-w-6xl space-y-8">
      <PageIntro
        tag={intro.tag}
        title={intro.title}
        description={intro.description}
      />

      <SkillFilterBar
        search={searchParam}
        onSearchChange={(value) => {
          setBrowseParams({ q: value || null, page: "1" });
        }}
        tagValue={tagParam}
        onTagChange={(value) => setBrowseParams({ tag: value || null, page: "1" })}
        sort={sort}
        onSortChange={(value) => setBrowseParams({ sort: value === "latest" ? null : value, page: "1" })}
        tagOptions={tagOptions}
        resultsLabel={
          tagParam && searchParam
            ? `${total} results for ${tagParam} / ${searchParam}`
            : tagParam
              ? `${total} ${pluralize(total, "skill")} in ${tagParam}`
              : searchParam
                ? `Searching for ${searchParam}`
                : `${total} ${pluralize(total, "skill")} available`
        }
      />

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
          {[...Array(6)].map((_, i) => (
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
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {skills.map((skill: any) => (
              <SkillCard key={skill.id} skill={skill} />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => setBrowseParams({ page: String(Math.max(1, page - 1)) })}
                disabled={page === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>

              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 7) {
                    pageNum = i + 1;
                  } else if (page <= 4) {
                    pageNum = i + 1;
                  } else if (page >= totalPages - 3) {
                    pageNum = totalPages - 6 + i;
                  } else {
                    pageNum = page - 3 + i;
                  }

                  return (
                    <Button
                      key={pageNum}
                      variant={page === pageNum ? "default" : "outline"}
                      size="sm"
                      className="w-10 font-mono text-[0.72rem]"
                      onClick={() => setBrowseParams({ page: String(pageNum) })}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>

              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => setBrowseParams({ page: String(Math.min(totalPages, page + 1)) })}
                disabled={page === totalPages}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      ) : (
        <section className="border border-border bg-card/45">
          <div className="flex flex-col items-center px-6 py-16 text-center md:px-10 md:py-20">
            <div className="flex h-16 w-16 items-center justify-center border border-primary/25 bg-primary/8">
              <Package className="h-8 w-8 text-primary" style={{ strokeWidth: 1.7 }} />
            </div>
            <h2 className="mt-6 text-2xl text-foreground md:text-3xl">
              {searchParam || tagParam ? "No Matching Skills" : "No Skills Yet"}
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground md:text-base">
              {searchParam || tagParam
                ? "Try a different search term, tag, or sort option to discover more TraderClaw skills."
                : "No skills have been published to the TraderClaw registry yet."}
            </p>
          </div>
        </section>
      )}
    </div>
  );
}
