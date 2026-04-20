import { FormEvent, Fragment, type ComponentType, type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  BookOpen,
  Loader2,
  Package,
  Search,
} from "@/components/ui/icons";
import {
  buildPageSearchEntries,
  docsSearchEntries,
  filterGlobalSearchEntries,
  type GlobalSearchIndexItem,
} from "@/lib/global-search";

type SearchTab = "all" | "skills" | "pages" | "docs";

interface GlobalSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentSearch?: string;
  isMacShortcut: boolean;
  userHandle?: string;
  isAdmin?: boolean;
}

interface SkillSearchResult {
  id: string;
  name: string;
  slug: string;
  description: string;
  tags?: string[];
  owner?: {
    handle?: string;
  };
}

interface SearchResultItem {
  id: string;
  kind: "skill" | "page" | "doc";
  title: string;
  href: string;
  description: string;
  section: string;
  meta?: string;
  icon: ComponentType<{ className?: string }>;
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function highlightText(value: string, query: string): ReactNode {
  const trimmedQuery = query.trim();

  if (!trimmedQuery) {
    return value;
  }

  const pattern = new RegExp(`(${escapeRegExp(trimmedQuery)})`, "ig");
  const segments = value.split(pattern);

  return segments.map((segment, index) =>
    index % 2 === 1 ? (
      <mark
        key={`${segment}-${index}`}
        className="bg-primary/16 px-0.5 text-foreground"
      >
        {segment}
      </mark>
    ) : (
      <Fragment key={`${segment}-${index}`}>{segment}</Fragment>
    ),
  );
}

function mapIndexedItems(items: GlobalSearchIndexItem[]): SearchResultItem[] {
  return items.map((item) => ({
    id: item.id,
    kind: item.kind,
    title: item.title,
    href: item.href,
    description: item.description,
    section: item.section,
    icon: item.icon,
  }));
}

function ResultRow({
  item,
  query,
  onSelect,
}: {
  item: SearchResultItem;
  query: string;
  onSelect: (href: string) => void;
}) {
  const Icon = item.icon;
  const kindLabel = item.kind === "skill" ? "SKILL" : item.kind === "doc" ? "DOCS" : "PAGE";

  return (
    <button
      type="button"
      onClick={() => onSelect(item.href)}
      className="group flex w-full items-start gap-3 border-b border-border/55 px-4 py-3.5 text-left transition-[background-color,border-color,transform] duration-200 ease-out hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/40"
    >
      <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center border border-border/75 bg-card/55 text-primary transition-colors duration-200 group-hover:border-primary/30 group-hover:bg-primary/7">
        <Icon className="h-[1.05rem] w-[1.05rem]" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <div className="truncate text-[0.95rem] font-semibold text-foreground">
              {highlightText(item.title, query)}
            </div>
            <div className="mt-1 line-clamp-2 text-sm leading-6 text-muted-foreground">
              {highlightText(item.description, query)}
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-[0.16em] text-muted-foreground" style={{ fontFamily: "var(--font-mono)" }}>
              <span className="border border-border/70 px-2 py-0.5 text-foreground/76">
                {item.section}
              </span>
              {item.meta ? <span>{highlightText(item.meta, query)}</span> : null}
            </div>
          </div>

          <div className="hidden shrink-0 items-center gap-2 sm:flex">
            <span
              className="border border-primary/25 bg-primary/7 px-2 py-1 text-[10px] uppercase tracking-[0.18em] text-primary"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              {kindLabel}
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}

function ResultsSection({
  title,
  items,
  query,
  onSelect,
  helper,
}: {
  title: string;
  items: SearchResultItem[];
  query: string;
  onSelect: (href: string) => void;
  helper?: ReactNode;
}) {
  return (
    <section>
      <div className="flex items-center justify-between gap-3 px-4 pb-2 pt-4">
        <div
          className="text-[10px] uppercase tracking-[0.2em] text-primary"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          {title}
        </div>
        {helper ? <div className="text-xs text-muted-foreground">{helper}</div> : null}
      </div>
      <div className="border-y border-border/55">
        {items.map((item) => (
          <ResultRow key={item.id} item={item} query={query} onSelect={onSelect} />
        ))}
      </div>
    </section>
  );
}

export function GlobalSearchDialog({
  open,
  onOpenChange,
  currentSearch = "",
  userHandle,
  isAdmin = false,
}: GlobalSearchDialogProps) {
  const [, navigate] = useLocation();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [query, setQuery] = useState(currentSearch);
  const [activeTab, setActiveTab] = useState<SearchTab>("all");
  const [debouncedQuery, setDebouncedQuery] = useState(currentSearch);

  useEffect(() => {
    if (!open) return;
    setActiveTab("all");
    setQuery(currentSearch);
    setDebouncedQuery(currentSearch);

    const timer = window.setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 20);

    return () => window.clearTimeout(timer);
  }, [currentSearch, open]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 140);

    return () => window.clearTimeout(timer);
  }, [query]);

  const pageEntries = useMemo(
    () => buildPageSearchEntries({ userHandle, isAdmin }),
    [isAdmin, userHandle],
  );

  const pageResults = useMemo(
    () => mapIndexedItems(filterGlobalSearchEntries(pageEntries, debouncedQuery)),
    [debouncedQuery, pageEntries],
  );

  const docResults = useMemo(
    () => mapIndexedItems(filterGlobalSearchEntries(docsSearchEntries, debouncedQuery)),
    [debouncedQuery],
  );

  const { data: fetchedSkills = [], isFetching } = useQuery<SkillSearchResult[]>({
    queryKey: ["global-search-skills", debouncedQuery],
    enabled: open && debouncedQuery.length > 0,
    queryFn: async () => {
      const response = await fetch(`/api/skills?search=${encodeURIComponent(debouncedQuery)}&limit=8&offset=0`);

      if (!response.ok) {
        throw new Error("Failed to search skills");
      }

      return response.json();
    },
  });

  const skillResults = useMemo<SearchResultItem[]>(() => {
    const items = fetchedSkills.map((skill) => ({
      id: skill.id,
      kind: "skill" as const,
      title: skill.name,
      href: `/skills/${skill.owner?.handle || "unknown"}/${skill.slug}`,
      description: skill.description || "Open this skill detail page in the registry.",
      section: "Registry",
      meta: [skill.owner?.handle ? `@${skill.owner.handle}` : null, ...(skill.tags || []).slice(0, 3)]
        .filter(Boolean)
        .join(" • "),
      icon: Package,
    }));

    if (debouncedQuery) {
      items.unshift({
        id: `search-all-${debouncedQuery}`,
        kind: "skill",
        title: `Search all skills for "${debouncedQuery}"`,
        href: `/browse?q=${encodeURIComponent(debouncedQuery)}`,
        description: "Open the full registry results with filters, tags, and sorting controls.",
        section: "Registry",
        meta: "Browse full results",
        icon: Search,
      });
    }

    return items;
  }, [debouncedQuery, fetchedSkills]);

  const visiblePageResults = debouncedQuery ? pageResults.slice(0, 6) : pageResults.slice(0, 5);
  const visibleDocResults = debouncedQuery ? docResults.slice(0, 6) : docResults.slice(0, 6);
  const visibleSkillResults = skillResults.slice(0, 7);

  const hasAnyResults =
    visibleSkillResults.length > 0 || visiblePageResults.length > 0 || visibleDocResults.length > 0;

  const handleSelect = (href: string) => {
    onOpenChange(false);
    navigate(href);
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const trimmedQuery = query.trim();

    if (!trimmedQuery) {
      return;
    }

    handleSelect(`/browse?q=${encodeURIComponent(trimmedQuery)}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="top-[50%] w-[calc(100vw-1rem)] max-w-[58rem] translate-y-[-50%] gap-0 overflow-hidden border-primary/16 bg-card p-0 pr-0 shadow-[0_32px_90px_rgba(0,0,0,0.54)] backdrop-blur-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-top-0 data-[state=open]:slide-in-from-top-0 sm:w-[calc(100vw-2rem)]">
        <DialogTitle className="sr-only">Global Search</DialogTitle>
        <DialogDescription className="sr-only">
          Search skills, workspace pages, and documentation.
        </DialogDescription>

        <div className="border-b border-border/70 bg-card px-4 pb-4 pt-4 pr-16 sm:px-5 sm:pb-5 sm:pt-5 sm:pr-20">
          <form onSubmit={handleSubmit}>
            <div className="group relative border border-primary/18 bg-background/92 px-4">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-primary/82" />
              <Input
                ref={inputRef}
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search skills, pages, docs..."
                className="h-12 border-0 bg-transparent pl-8 pr-0 text-base text-foreground shadow-none placeholder:text-muted-foreground/78 focus-visible:ring-0"
              />
            </div>
          </form>
        </div>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as SearchTab)} className="min-h-0">
          <div className="border-b border-border/60 bg-card px-4 py-3 sm:px-5">
            <TabsList className="w-full justify-start sm:w-auto">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="skills">Skills</TabsTrigger>
              <TabsTrigger value="pages">Pages</TabsTrigger>
              <TabsTrigger value="docs">Docs</TabsTrigger>
            </TabsList>
          </div>

          <ScrollArea className="h-[min(62svh,36rem)]">
            <TabsContent value="all" className="mt-0 pb-4">
              {!debouncedQuery ? (
                <>
                  <ResultsSection
                    title="Quick Pages"
                    items={visiblePageResults}
                    query={query}
                    onSelect={handleSelect}
                  />
                  <ResultsSection
                    title="Docs"
                    items={visibleDocResults}
                    query={query}
                    onSelect={handleSelect}
                  />
                  <div className="px-4 pt-4 text-sm text-muted-foreground sm:px-5">
                    Start typing to search live skill results from the registry.
                  </div>
                </>
              ) : (
                <>
                  {visibleSkillResults.length > 0 ? (
                    <ResultsSection
                      title="Skills"
                      items={visibleSkillResults}
                      query={query}
                      onSelect={handleSelect}
                      helper={isFetching ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                    />
                  ) : null}
                  {visiblePageResults.length > 0 ? (
                    <ResultsSection
                      title="Pages"
                      items={visiblePageResults}
                      query={query}
                      onSelect={handleSelect}
                    />
                  ) : null}
                  {visibleDocResults.length > 0 ? (
                    <ResultsSection
                      title="Docs"
                      items={visibleDocResults}
                      query={query}
                      onSelect={handleSelect}
                    />
                  ) : null}
                  {!hasAnyResults && !isFetching ? (
                    <div className="flex min-h-[14rem] flex-col items-center justify-center px-6 text-center">
                      <div className="flex h-12 w-12 items-center justify-center border border-border/70 bg-card/60 text-primary">
                        <BookOpen className="h-5 w-5" />
                      </div>
                      <div className="mt-4 text-base font-semibold text-foreground">No results found</div>
                      <div className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                        Try a different term or press Enter to search the full registry for “{debouncedQuery}”.
                      </div>
                    </div>
                  ) : null}
                </>
              )}
            </TabsContent>

            <TabsContent value="skills" className="mt-0 pb-4">
              {debouncedQuery ? (
                visibleSkillResults.length > 0 ? (
                  <ResultsSection
                    title="Skills"
                    items={visibleSkillResults}
                    query={query}
                    onSelect={handleSelect}
                    helper={isFetching ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                  />
                ) : !isFetching ? (
                  <div className="px-4 py-8 text-sm text-muted-foreground sm:px-5">
                    No skill matches yet. Press Enter to search the full registry for “{debouncedQuery}”.
                  </div>
                ) : null
              ) : (
                <div className="px-4 py-8 text-sm text-muted-foreground sm:px-5">
                  Start typing to search live skills from the registry.
                </div>
              )}
            </TabsContent>

            <TabsContent value="pages" className="mt-0 pb-4">
              {visiblePageResults.length > 0 ? (
                <ResultsSection
                  title={debouncedQuery ? "Matching Pages" : "Quick Pages"}
                  items={visiblePageResults}
                  query={query}
                  onSelect={handleSelect}
                />
              ) : (
                <div className="px-4 py-8 text-sm text-muted-foreground sm:px-5">
                  No matching workspace pages for “{debouncedQuery}”.
                </div>
              )}
            </TabsContent>

            <TabsContent value="docs" className="mt-0 pb-4">
              {visibleDocResults.length > 0 ? (
                <ResultsSection
                  title={debouncedQuery ? "Matching Docs" : "Popular Docs"}
                  items={visibleDocResults}
                  query={query}
                  onSelect={handleSelect}
                />
              ) : (
                <div className="px-4 py-8 text-sm text-muted-foreground sm:px-5">
                  No matching docs results for “{debouncedQuery}”.
                </div>
              )}
            </TabsContent>
          </ScrollArea>
        </Tabs>

        <div className="flex items-center justify-between gap-3 border-t border-border/60 bg-card/44 px-4 py-3 text-[11px] uppercase tracking-[0.14em] text-muted-foreground sm:px-5" style={{ fontFamily: "var(--font-mono)" }}>
          <span>Enter to search all skills</span>
          <span>Esc to close</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
