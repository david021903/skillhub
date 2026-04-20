import {
  createContext,
  useEffect,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ComponentType,
  type ReactNode,
  type RefObject,
} from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ShortcutHint } from "@/components/ShortcutHint";
import { usePageSeo } from "@/lib/seo";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Bot,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  FileText,
  Globe,
  Key,
  Menu,
  Search,
  ShieldCheck,
  Terminal,
  X,
} from "@/components/ui/icons";

export const isDocsSubdomain =
  typeof window !== "undefined" && window.location.hostname.startsWith("docs.");

export function docsHref(path: string): string {
  if (isDocsSubdomain) {
    return path === "/docs" ? "/" : path.replace(/^\/docs/, "");
  }
  return path;
}

function docsAppHref(): string {
  return isDocsSubdomain ? "https://skills.traderclaw.ai" : "/";
}

export function toCanonicalDocsPath(location: string): string {
  if (isDocsSubdomain) {
    return location === "/" ? "/docs" : "/docs" + location;
  }
  return location;
}

interface DocsPage {
  title: string;
  href: string;
  canonicalHref: string;
}

interface DocsSection {
  title: string;
  href: string;
  canonicalHref: string;
  icon: ComponentType<{ className?: string }>;
  pages: DocsPage[];
}

interface SearchEntry extends DocsPage {
  sectionTitle: string;
}

function makeDocsSections(): DocsSection[] {
  const raw = [
    {
      title: "Getting Started",
      href: "/docs",
      icon: BookOpen,
      pages: [
        { title: "What is SkillHub?", href: "/docs" },
        { title: "Quick Start", href: "/docs/quick-start" },
        { title: "Creating an Account", href: "/docs/account" },
      ],
    },
    {
      title: "SKILL.md Format",
      href: "/docs/skill-format",
      icon: FileText,
      pages: [
        { title: "Overview", href: "/docs/skill-format" },
        { title: "YAML Frontmatter", href: "/docs/skill-format/frontmatter" },
        { title: "Markdown Body", href: "/docs/skill-format/body" },
        { title: "Examples", href: "/docs/skill-format/examples" },
      ],
    },
    {
      title: "Web Platform",
      href: "/docs/platform",
      icon: Globe,
      pages: [
        { title: "Browsing Skills", href: "/docs/platform" },
        { title: "Publishing Skills", href: "/docs/platform/publishing" },
        { title: "Version Management", href: "/docs/platform/versions" },
        { title: "Issues & Pull Requests", href: "/docs/platform/collaboration" },
        { title: "Forking", href: "/docs/platform/forking" },
      ],
    },
    {
      title: "CLI (shsc)",
      href: "/docs/cli",
      icon: Terminal,
      pages: [
        { title: "Installation", href: "/docs/cli" },
        { title: "Authentication", href: "/docs/cli/auth" },
        { title: "Publishing & Installing", href: "/docs/cli/publish-install" },
        { title: "Search & Browse", href: "/docs/cli/search" },
        { title: "Validation", href: "/docs/cli/validation" },
        { title: "Templates", href: "/docs/cli/templates" },
        { title: "Dependency Checking", href: "/docs/cli/dependencies" },
      ],
    },
    {
      title: "Validation & Scoring",
      href: "/docs/validation",
      icon: ShieldCheck,
      pages: [
        { title: "How It Works", href: "/docs/validation" },
        { title: "Scoring Criteria", href: "/docs/validation/criteria" },
        { title: "Improving Your Score", href: "/docs/validation/improving" },
      ],
    },
    {
      title: "AI Features",
      href: "/docs/ai",
      icon: Bot,
      pages: [
        { title: "Overview", href: "/docs/ai" },
        { title: "Skill Explainer", href: "/docs/ai/explainer" },
        { title: "Skill Generator", href: "/docs/ai/generator" },
        { title: "Skill Chat", href: "/docs/ai/chat" },
      ],
    },
    {
      title: "API Tokens",
      href: "/docs/tokens",
      icon: Key,
      pages: [
        { title: "Overview", href: "/docs/tokens" },
        { title: "Creating Tokens", href: "/docs/tokens/creating" },
        { title: "Scopes & Permissions", href: "/docs/tokens/scopes" },
        { title: "Using with CLI", href: "/docs/tokens/cli-usage" },
      ],
    },
  ];

  return raw.map((section) => ({
    ...section,
    canonicalHref: section.href,
    href: docsHref(section.href),
    pages: section.pages.map((page) => ({
      ...page,
      canonicalHref: page.href,
      href: docsHref(page.href),
    })),
  }));
}

const docsSections = makeDocsSections();

function normalizeDocsSeoCopy(value?: string) {
  if (!value) {
    return value;
  }

  const normalized = value
    .replace(/\bSkillHub\b/g, "TraderClaw Skills")
    .replace(/\bOpenClaw\b/g, "TraderClaw")
    .replace(/\bshsc\b/g, "tcs")
    .replace(/skillhub\.space/g, "skills.traderclaw.ai");

  if (normalized === "What is TraderClaw Skills?") {
    return "What Is the TraderClaw Skills Registry?";
  }

  return normalized;
}

const docsFooterLinks = [
  { label: "Official Website", href: () => "https://www.traderclaw.ai", external: true },
  { label: "Builder Website", href: () => "https://build.traderclaw.ai", external: true },
];

const docsSocialLinks = [
  { label: "X / Twitter", href: "https://x.com/traderclawai" },
  { label: "Telegram", href: "https://t.me/traderclaw_ai" },
  { label: "Discord", href: "https://discord.com/invite/CeBhxtkGMa" },
  { label: "YouTube", href: "https://www.youtube.com/@traderclaw" },
];

const docsLegalLinks = [
  { label: "Terms & Conditions", href: "/terms", external: false },
  { label: "Privacy Policy", href: "/privacy", external: false },
];

const DocsShellRegisterContext = createContext<((page: DocsLayoutProps) => void) | null>(null);

function DocsBrand() {
  return (
    <div className="flex items-center gap-3">
      <img
        src="/traderclaw-logo.png"
        alt="TraderClaw"
        width="542"
        height="80"
        decoding="async"
        className="h-[1.75rem] w-auto shrink-0 object-contain md:h-[1.95rem]"
      />
      <div
        className="inline-flex items-center border border-primary/55 px-1.5 py-0.5 text-[9px] uppercase tracking-[0.18em] text-primary"
        style={{ fontFamily: "var(--font-mono)" }}
      >
        Skills
      </div>
    </div>
  );
}

function DocsSearchField({
  searchQuery,
  setSearchQuery,
  searchResults,
  isMac,
  inputRef,
  onResultSelect,
}: {
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  searchResults: SearchEntry[];
  isMac: boolean;
  inputRef: RefObject<HTMLInputElement | null>;
  onResultSelect: () => void;
}) {
  const showSearchState = searchQuery.trim().length >= 2;

  return (
    <div className="relative w-full lg:max-w-[35rem]">
      <div className="group relative border border-primary/18 bg-card/90 px-3 shadow-[inset_0_0_0_1px_rgba(249,55,40,0.02)] transition-[border-color,background-color,box-shadow,transform] duration-200 ease-out hover:-translate-y-[1px] hover:border-primary/28 hover:bg-card focus-within:border-primary/34 focus-within:bg-card focus-within:shadow-[inset_0_0_0_1px_rgba(249,55,40,0.08)]">
        <div className="pointer-events-none absolute left-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center border border-primary/14 bg-background/78 text-primary/84 transition-colors duration-200 group-hover:border-primary/22 group-hover:bg-primary/6">
          <Search className="h-3.5 w-3.5" />
        </div>
        <Input
          ref={inputRef}
          placeholder="Search docs"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          className="h-12 border-0 bg-transparent pl-10 pr-4 text-sm text-foreground shadow-none placeholder:text-muted-foreground/66 focus-visible:ring-0 sm:pr-[5.35rem]"
        />
      </div>
      <div className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 sm:flex">
        <ShortcutHint
          isMac={isMac}
          className="h-6 items-center border border-primary/14 bg-background/88 px-2 text-foreground/62"
        />
      </div>

      {showSearchState && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden border border-primary/18 bg-card shadow-[0_24px_60px_rgba(0,0,0,0.42)]">
          {searchResults.length > 0 ? (
            searchResults.map((result) => (
              <Link key={result.canonicalHref} href={result.href}>
                <div
                  onClick={() => {
                    onResultSelect();
                    setSearchQuery("");
                  }}
                  className="cursor-pointer border-b border-primary/10 px-4 py-3 transition-colors last:border-b-0 hover:bg-primary/6"
                >
                  <div className="text-sm font-medium text-foreground">{result.title}</div>
                  <div
                    className="mt-1 inline-flex items-center border border-primary/26 bg-background/64 px-1.5 py-0.5 text-[9px] uppercase tracking-[0.18em] text-primary/88"
                    style={{ fontFamily: "var(--font-mono)" }}
                  >
                    {result.sectionTitle}
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <div className="px-4 py-4 text-sm text-foreground/68">
              No docs found for “{searchQuery.trim()}”.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function DocsFooter() {
  return (
    <footer className="mt-16 border-t border-primary/12 pt-8">
      <div className="grid gap-8 md:grid-cols-[1.2fr_.8fr_.8fr_.8fr]">
        <div className="max-w-sm">
          <img
            src="/traderclaw-logo-icon.svg"
            alt="TraderClaw"
            className="h-16 w-16 object-contain"
          />
          <p className="mt-4 text-sm leading-7 text-foreground/72">
            Official skill registry docs surface of TraderClaw.
          </p>
        </div>

        <div>
          <div
            className="text-[10px] uppercase tracking-[0.22em] text-primary"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            Links
          </div>
          <div className="mt-4 flex flex-col gap-3 text-sm text-foreground/68">
            {docsFooterLinks.map((link) => {
              const href = link.href();
              return link.external ? (
                <a
                  key={link.label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-colors hover:text-foreground"
                >
                  {link.label}
                </a>
              ) : (
                <Link key={link.label} href={href}>
                  <span className="cursor-pointer transition-colors hover:text-foreground">
                    {link.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>

        <div>
          <div
            className="text-[10px] uppercase tracking-[0.22em] text-primary"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            Socials
          </div>
          <div className="mt-4 flex flex-col gap-3 text-sm text-foreground/68">
            {docsSocialLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors hover:text-foreground"
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>

        <div>
          <div
            className="text-[10px] uppercase tracking-[0.22em] text-primary"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            Legal
          </div>
          <div className="mt-4 flex flex-col gap-3 text-sm text-foreground/68">
            {docsLegalLinks.map((link) => (
              <Link key={link.label} href={link.href}>
                <span className="cursor-pointer transition-colors hover:text-foreground">
                  {link.label}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

function DocsNavSection({
  section,
  canonicalPath,
  onNavigate,
}: {
  section: DocsSection;
  canonicalPath: string;
  onNavigate: () => void;
}) {
  const isSectionActive = section.pages.some((page) => page.canonicalHref === canonicalPath);
  const [expanded, setExpanded] = useState(isSectionActive);
  const Icon = section.icon;

  useEffect(() => {
    if (isSectionActive) {
      setExpanded(true);
    }
  }, [isSectionActive]);

  return (
    <div className="py-1.5">
      <button
        type="button"
        onClick={() => setExpanded((current) => !current)}
        className={`flex min-h-[3.25rem] w-full items-center justify-between gap-3 px-2 py-2 text-left transition-colors ${
          isSectionActive ? "bg-primary/6" : "hover:bg-card/72"
        }`}
      >
        <div className="flex min-w-0 items-center gap-3">
          <span
            className={`flex h-9 w-9 shrink-0 items-center justify-center border ${
              isSectionActive
                ? "border-primary/20 bg-primary/10 text-primary"
                : "border-border/70 bg-card/62 text-foreground/55"
            }`}
          >
            <Icon className="h-4 w-4 shrink-0" />
          </span>
          <span className="text-sm font-medium leading-6 text-foreground/88">{section.title}</span>
        </div>
        {expanded ? (
          <ChevronDown className="h-4 w-4 shrink-0 text-foreground/45" />
        ) : (
          <ChevronRight className="h-4 w-4 shrink-0 text-foreground/45" />
        )}
      </button>

      {expanded && (
        <div className="relative ml-[1.125rem] mt-2 space-y-1 pl-8 before:absolute before:bottom-2 before:left-0 before:top-1 before:w-px before:bg-border/75">
          {section.pages.map((page) => {
            const isActive = page.canonicalHref === canonicalPath;
            return (
              <Link key={page.canonicalHref} href={page.href}>
                <div
                  onClick={onNavigate}
                  className={`flex min-h-[2.75rem] cursor-pointer items-center px-3 py-2 text-sm leading-6 transition-colors ${
                    isActive
                      ? "border border-primary/18 bg-primary/10 text-primary"
                      : "text-foreground/64 hover:bg-card/72 hover:text-foreground"
                  }`}
                >
                  {page.title}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

interface DocsLayoutProps {
  children: ReactNode;
  title: string;
  description?: string;
}

export function DocsLayoutProvider({ children }: { children: ReactNode }) {
  const [page, setPage] = useState<DocsLayoutProps | null>(null);

  return (
    <DocsShellRegisterContext.Provider value={setPage}>
      {children}
      {page ? <DocsLayoutShell {...page} /> : null}
    </DocsShellRegisterContext.Provider>
  );
}

function DocsLayoutShell({ children, title, description }: DocsLayoutProps) {
  const [location, setLocation] = useLocation();
  const canonicalPath = toCanonicalDocsPath(location);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showBackToTop, setShowBackToTop] = useState(false);
  const articleRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const [isMac, setIsMac] = useState(false);

  const allPages = useMemo<SearchEntry[]>(
    () =>
      docsSections.flatMap((section) =>
        section.pages.map((page) => ({
          ...page,
          sectionTitle: section.title,
        })),
      ),
    [],
  );

  const searchResults = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (query.length < 2) {
      return [];
    }

    return allPages.filter(
      (page) =>
        page.title.toLowerCase().includes(query) ||
        page.sectionTitle.toLowerCase().includes(query),
    );
  }, [allPages, searchQuery]);

  const currentIndex = allPages.findIndex((page) => page.canonicalHref === canonicalPath);
  const prevPage = currentIndex > 0 ? allPages[currentIndex - 1] : null;
  const nextPage = currentIndex >= 0 && currentIndex < allPages.length - 1 ? allPages[currentIndex + 1] : null;
  const currentSection =
    docsSections.find((section) => section.pages.some((page) => page.canonicalHref === canonicalPath)) || null;

  usePageSeo({
    title: normalizeDocsSeoCopy(title),
    description: normalizeDocsSeoCopy(description),
    canonicalPath,
    robots: "index,follow",
    suffix: "Docs | TraderClaw",
  });

  useEffect(() => {
    if (typeof navigator === "undefined") {
      return;
    }

    const platform = navigator.platform || navigator.userAgent;
    setIsMac(/Mac|iPhone|iPad|iPod/i.test(platform));
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.altKey || event.shiftKey) {
        return;
      }

      if (event.key.toLowerCase() !== "k") {
        return;
      }

      if ((isMac && !event.metaKey) || (!isMac && !event.ctrlKey)) {
        return;
      }

      const target = event.target as HTMLElement | null;
      const isEditable =
        !!target &&
        (target.isContentEditable ||
          target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT");

      if (isEditable && target !== searchInputRef.current) {
        return;
      }

      event.preventDefault();
      setMobileNavOpen(false);
      window.requestAnimationFrame(() => {
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      });
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isMac]);

  useEffect(() => {
    const root = articleRef.current;
    if (!root) return;

    const blocks = Array.from(root.querySelectorAll("pre"));
    const cleanupCallbacks: Array<() => void> = [];

    blocks.forEach((pre) => {
      const parent = pre.parentElement;
      if (!parent || parent.dataset.docsTerminal === "true") {
        return;
      }

      const wrapper = document.createElement("div");
      wrapper.className = "tc-docs-terminal not-prose";
      wrapper.dataset.docsTerminal = "true";

      const toolbar = document.createElement("div");
      toolbar.className = "tc-docs-terminal-bar";

      const label = document.createElement("span");
      label.className = "tc-docs-terminal-label";
      label.textContent = /(^|\n)\s*(npm|pnpm|yarn|bun|npx|shsc|tcs|curl|git|cd|export|cat|node|python|uv)\b/m.test(pre.textContent || "")
        ? "Terminal"
        : "Example";

      const button = document.createElement("button");
      button.type = "button";
      button.className = "tc-docs-terminal-copy";
      button.textContent = "Copy";

      const handleCopy = async () => {
        const text = pre.textContent?.trim();
        if (!text) return;

        try {
          await navigator.clipboard.writeText(text);
          button.textContent = "Copied";
          window.setTimeout(() => {
            button.textContent = "Copy";
          }, 1800);
        } catch {
          button.textContent = "Failed";
          window.setTimeout(() => {
            button.textContent = "Copy";
          }, 1800);
        }
      };

      button.addEventListener("click", handleCopy);
      cleanupCallbacks.push(() => button.removeEventListener("click", handleCopy));

      toolbar.append(label, button);
      parent.insertBefore(wrapper, pre);
      wrapper.append(toolbar, pre);
    });

    return () => {
      cleanupCallbacks.forEach((callback) => callback());
    };
  }, [canonicalPath]);

  useEffect(() => {
    const root = articleRef.current;
    if (!root) return;

    const handleLinkClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) {
        return;
      }

      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
      }

      const target = event.target as HTMLElement | null;
      const link = target?.closest("a[href]") as HTMLAnchorElement | null;
      if (!link) {
        return;
      }

      const href = link.getAttribute("href");
      if (!href || href.startsWith("#") || link.target === "_blank" || link.hasAttribute("download")) {
        return;
      }

      if (href.startsWith("/docs")) {
        event.preventDefault();
        setLocation(docsHref(href));
      }
    };

    root.addEventListener("click", handleLinkClick);
    return () => root.removeEventListener("click", handleLinkClick);
  }, [setLocation]);

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 420);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="tc-app-shell tc-docs-shell min-h-screen bg-background text-foreground">
      <div className="lg:min-h-screen">
        <aside className="hidden border-r border-primary/12 bg-card/42 lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:flex lg:w-[344px] lg:flex-col lg:overflow-hidden">
          <div className="px-6 pb-5 pt-6">
            <Link href={docsHref("/docs")} className="flex items-center">
              <DocsBrand />
            </Link>
          </div>

          <div className="flex-1 overflow-y-auto px-5 pb-6 pt-1">
            <div className="space-y-0.5 border-t border-primary/10 pt-4">
              {docsSections.map((section) => (
                <DocsNavSection
                  key={section.canonicalHref}
                  section={section}
                  canonicalPath={canonicalPath}
                  onNavigate={() => setMobileNavOpen(false)}
                />
              ))}
            </div>
          </div>
        </aside>

        <div className="min-w-0 lg:ml-[344px]">
          <header className="sticky top-0 z-50 border-b border-primary/12 bg-background/94 backdrop-blur">
            <div className="mx-auto w-full max-w-[1240px] px-4 py-3 md:px-8 lg:px-10">
              <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center lg:gap-6">
                <div className="flex min-w-0 items-center justify-between gap-3 lg:hidden">
                  <div className="flex min-w-0 items-center gap-3">
                    <button
                      type="button"
                      className="flex h-10 w-10 items-center justify-center border border-primary/16 bg-card/72 text-foreground"
                      onClick={() => setMobileNavOpen((current) => !current)}
                    >
                      {mobileNavOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
                    </button>
                    <Link href={docsHref("/docs")} className="flex min-w-0 items-center">
                      <DocsBrand />
                    </Link>
                  </div>

                  <a href={docsAppHref()}>
                    <Button size="sm" className="min-w-[9.5rem] text-primary-foreground">
                      Open App
                    </Button>
                  </a>
                </div>

                <DocsSearchField
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  searchResults={searchResults}
                  isMac={isMac}
                  inputRef={searchInputRef}
                  onResultSelect={() => setMobileNavOpen(false)}
                />

                <div className="hidden lg:flex lg:justify-end">
                  <a href={docsAppHref()}>
                    <Button size="sm" className="min-w-[10.25rem] text-primary-foreground">
                      Open App
                    </Button>
                  </a>
                </div>
              </div>
            </div>
          </header>

          <aside
            className={`fixed inset-y-0 left-0 z-40 w-[min(340px,calc(100vw-1rem))] border-r border-primary/12 bg-background/96 px-4 pb-6 pt-4 backdrop-blur transition-transform lg:hidden ${
              mobileNavOpen ? "translate-x-0" : "-translate-x-full"
            }`}
          >
            <div className="border-b border-primary/12 px-2 pb-4">
              <Link href={docsHref("/docs")} className="flex items-center">
                <DocsBrand />
              </Link>
            </div>

            <div className="mt-4 max-h-[calc(100vh-7rem)] overflow-y-auto border-t border-primary/10 pt-4">
              {docsSections.map((section) => (
                <DocsNavSection
                  key={section.canonicalHref}
                  section={section}
                  canonicalPath={canonicalPath}
                  onNavigate={() => setMobileNavOpen(false)}
                />
              ))}
            </div>
          </aside>

          {mobileNavOpen && (
            <div
              className="fixed inset-0 z-30 bg-black/60 lg:hidden"
              onClick={() => setMobileNavOpen(false)}
            />
          )}

          <main className="min-w-0">
            <div className="mx-auto w-full max-w-[1240px] px-4 py-8 md:px-8 lg:px-10 lg:py-10">
              <div className="border-b border-primary/12 pb-10">
                <div
                  className="inline-flex items-center border border-primary/55 px-2 py-1 text-[10px] uppercase tracking-[0.18em] text-primary"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  {currentSection?.title || "Skills"}
                </div>
                <h1 className="mt-5 max-w-4xl text-4xl text-foreground md:text-5xl">{title}</h1>
                {description && (
                  <p className="mt-5 max-w-3xl text-base leading-8 text-foreground/78">
                    {description}
                  </p>
                )}
              </div>

              <div
                ref={articleRef}
                className="prose prose-invert mt-8 max-w-none
                  prose-headings:scroll-mt-28 prose-headings:text-foreground
                  prose-h2:mt-12 prose-h2:border-b prose-h2:border-primary/12 prose-h2:pb-3 prose-h2:text-2xl prose-h2:font-semibold
                  prose-h3:mt-8 prose-h3:text-xl prose-h3:font-semibold
                  prose-p:max-w-none prose-p:text-[1rem] prose-p:leading-8 prose-p:text-foreground/82
                  prose-li:text-foreground/78 prose-li:leading-7
                  prose-ul:pl-5
                  prose-ol:pl-5
                  prose-code:border prose-code:border-primary/12 prose-code:bg-card prose-code:px-1.5 prose-code:py-0.5 prose-code:text-sm prose-code:text-[#ffd5cd] prose-code:before:content-none prose-code:after:content-none
                  prose-pre:m-0 prose-pre:border-0 prose-pre:bg-transparent prose-pre:p-0 prose-pre:shadow-none
                  prose-strong:text-[#f5efec]
                  prose-a:text-primary prose-a:no-underline hover:prose-a:text-[#ff8c7f]
                  prose-hr:border-primary/12
                  prose-table:text-sm prose-table:text-foreground/82
                  prose-th:border-b prose-th:border-primary/12 prose-th:bg-card prose-th:px-4 prose-th:py-2 prose-th:text-foreground
                  prose-td:border-b prose-td:border-primary/10 prose-td:px-4 prose-td:py-2"
              >
                {children}
              </div>

              <div
                className={`pointer-events-none sticky bottom-6 z-20 mt-8 flex justify-end transition-all duration-200 ${
                  showBackToTop ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
                }`}
              >
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  title="Back to top"
                  aria-label="Back to top"
                  onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                  className="pointer-events-auto h-11 w-11 border-primary/20 bg-card/92 text-foreground hover:border-primary/38 hover:bg-card"
                >
                  <ChevronUp className="h-4 w-4" />
                </Button>
              </div>

              <div className="mt-16 grid gap-4 border-t border-primary/12 pt-6 md:grid-cols-2">
                {prevPage ? (
                  <Link href={prevPage.href}>
                    <div className="group flex min-h-[7.75rem] cursor-pointer flex-col justify-between border border-primary/14 bg-card/62 p-5 text-left transition-colors hover:border-primary/28 hover:bg-card">
                      <div
                        className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground"
                        style={{ fontFamily: "var(--font-mono)" }}
                      >
                        Previous
                      </div>
                      <div className="mt-5 flex items-center gap-3 text-base text-foreground transition-colors group-hover:text-primary">
                        <span className="flex h-10 w-10 items-center justify-center border border-primary/16 bg-background/72 text-foreground transition-colors group-hover:border-primary/28 group-hover:text-primary">
                          <ArrowLeft className="h-4 w-4" />
                        </span>
                        <span className="max-w-[20rem] leading-6">{prevPage.title}</span>
                      </div>
                    </div>
                  </Link>
                ) : (
                  <div className="hidden md:block" />
                )}

                {nextPage ? (
                  <Link href={nextPage.href}>
                    <div className="group flex min-h-[7.75rem] cursor-pointer flex-col justify-between border border-primary/14 bg-card/62 p-5 text-left transition-colors hover:border-primary/28 hover:bg-card md:text-right">
                      <div
                        className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground"
                        style={{ fontFamily: "var(--font-mono)" }}
                      >
                        Next
                      </div>
                      <div className="mt-5 flex items-center gap-3 text-base text-foreground transition-colors group-hover:text-primary md:justify-end">
                        <span className="max-w-[20rem] leading-6">{nextPage.title}</span>
                        <span className="flex h-10 w-10 items-center justify-center border border-primary/16 bg-background/72 text-foreground transition-colors group-hover:border-primary/28 group-hover:text-primary">
                          <ArrowRight className="h-4 w-4" />
                        </span>
                      </div>
                    </div>
                  </Link>
                ) : (
                  <div className="hidden md:block" />
                )}
              </div>

              <DocsFooter />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

export default function DocsLayout(props: DocsLayoutProps) {
  const [location] = useLocation();
  const canonicalPath = toCanonicalDocsPath(location);
  const registerPage = useContext(DocsShellRegisterContext);

  useLayoutEffect(() => {
    if (registerPage) {
      registerPage(props);
    }
  }, [registerPage, canonicalPath, props.title, props.description]);

  if (registerPage) {
    return null;
  }

  return <DocsLayoutShell {...props} />;
}
