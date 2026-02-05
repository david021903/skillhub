import { useState, ReactNode, useMemo } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { AuthForms } from "@/components/AuthForms";
import { useAuth } from "@/hooks/use-auth";
import {
  Search,
  Menu,
  X,
  ChevronRight,
  ChevronDown,
  ArrowLeft,
} from "lucide-react";

export const isDocsSubdomain = typeof window !== "undefined" && window.location.hostname.startsWith("docs.");

export function docsHref(path: string): string {
  if (isDocsSubdomain) {
    return path === "/docs" ? "/" : path.replace(/^\/docs/, "");
  }
  return path;
}

export function toCanonicalDocsPath(location: string): string {
  if (isDocsSubdomain) {
    return location === "/" ? "/docs" : "/docs" + location;
  }
  return location;
}

interface NavItem {
  title: string;
  href: string;
  canonicalHref: string;
  children?: NavItem[];
}

function makeNavItems(): NavItem[] {
  const raw = [
    {
      title: "🚀 Getting Started",
      href: "/docs",
      children: [
        { title: "What is SkillHub?", href: "/docs" },
        { title: "Quick Start", href: "/docs/quick-start" },
        { title: "Creating an Account", href: "/docs/account" },
      ],
    },
    {
      title: "📄 SKILL.md Format",
      href: "/docs/skill-format",
      children: [
        { title: "Overview", href: "/docs/skill-format" },
        { title: "YAML Frontmatter", href: "/docs/skill-format/frontmatter" },
        { title: "Markdown Body", href: "/docs/skill-format/body" },
        { title: "Examples", href: "/docs/skill-format/examples" },
      ],
    },
    {
      title: "🌐 Web Platform",
      href: "/docs/platform",
      children: [
        { title: "Browsing Skills", href: "/docs/platform" },
        { title: "Publishing Skills", href: "/docs/platform/publishing" },
        { title: "Version Management", href: "/docs/platform/versions" },
        { title: "Issues & Pull Requests", href: "/docs/platform/collaboration" },
        { title: "Forking", href: "/docs/platform/forking" },
      ],
    },
    {
      title: "💻 CLI (shsc)",
      href: "/docs/cli",
      children: [
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
      title: "✅ Validation & Scoring",
      href: "/docs/validation",
      children: [
        { title: "How It Works", href: "/docs/validation" },
        { title: "Scoring Criteria", href: "/docs/validation/criteria" },
        { title: "Improving Your Score", href: "/docs/validation/improving" },
      ],
    },
    {
      title: "🤖 AI Features",
      href: "/docs/ai",
      children: [
        { title: "Overview", href: "/docs/ai" },
        { title: "Skill Explainer", href: "/docs/ai/explainer" },
        { title: "Skill Generator", href: "/docs/ai/generator" },
        { title: "Skill Chat", href: "/docs/ai/chat" },
      ],
    },
    {
      title: "🔑 API Tokens",
      href: "/docs/tokens",
      children: [
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
    children: section.children?.map((child) => ({
      ...child,
      canonicalHref: child.href,
      href: docsHref(child.href),
    })),
  }));
}

const navItems = makeNavItems();

function NavSection({
  item,
  canonicalPath,
  depth = 0,
}: {
  item: NavItem;
  canonicalPath: string;
  depth?: number;
}) {
  const isActive = canonicalPath === item.canonicalHref;
  const hasChildren = item.children && item.children.length > 0;
  const isParentActive = hasChildren && item.children!.some((c) => canonicalPath === c.canonicalHref);
  const [expanded, setExpanded] = useState(isActive || isParentActive);

  if (depth === 0 && hasChildren) {
    return (
      <div className="mb-1">
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-between px-3 py-2 text-sm font-semibold text-foreground hover:bg-accent/10 rounded-lg transition-colors"
        >
          <span>{item.title}</span>
          {expanded ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
        </button>
        {expanded && (
          <div className="ml-2 mt-0.5 space-y-0.5 border-l-2 border-border pl-2">
            {item.children!.map((child) => (
              <NavSection
                key={child.href}
                item={child}
                canonicalPath={canonicalPath}
                depth={depth + 1}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <Link href={item.href}>
      <div
        className={`block px-3 py-1.5 text-sm rounded-md transition-colors cursor-pointer ${
          isActive
            ? "bg-primary/10 text-primary font-medium border-l-2 border-primary -ml-[2px] pl-[14px]"
            : "text-muted-foreground hover:text-foreground hover:bg-muted"
        }`}
      >
        {item.title}
      </div>
    </Link>
  );
}

interface DocsLayoutProps {
  children: ReactNode;
  title: string;
  description?: string;
}

export default function DocsLayout({ children, title, description }: DocsLayoutProps) {
  const { user } = useAuth();
  const [location] = useLocation();
  const canonicalPath = toCanonicalDocsPath(location);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<NavItem[]>([]);
  const [showSearch, setShowSearch] = useState(false);

  const allPages = navItems.flatMap((section) =>
    section.children
      ? section.children.map((child) => ({
          ...child,
          section: section.title,
        }))
      : [{ ...section, section: "" }]
  );

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim().length < 2) {
      setSearchResults([]);
      setShowSearch(false);
      return;
    }
    const results = allPages.filter(
      (p) =>
        p.title.toLowerCase().includes(query.toLowerCase()) ||
        (p as any).section.toLowerCase().includes(query.toLowerCase())
    );
    setSearchResults(results);
    setShowSearch(true);
  };

  const currentIndex = allPages.findIndex((p) => p.canonicalHref === canonicalPath);
  const prevPage = currentIndex > 0 ? allPages[currentIndex - 1] : null;
  const nextPage = currentIndex < allPages.length - 1 ? allPages[currentIndex + 1] : null;

  return (
    <div className="min-h-screen bg-background">
      <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center justify-between px-4 max-w-screen-2xl mx-auto">
          <div className="flex items-center gap-4">
            <button
              className="lg:hidden p-2 hover:bg-muted rounded-md"
              onClick={() => setMobileNavOpen(!mobileNavOpen)}
            >
              {mobileNavOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            {isDocsSubdomain ? (
              <a href="https://skillhub.space" className="flex items-center gap-2">
                <img src="/logo-dark.png" alt="SkillHub" className="h-6 dark:invert" />
              </a>
            ) : (
              <Link href="/" className="flex items-center gap-2">
                <img src="/logo-dark.png" alt="SkillHub" className="h-6 dark:invert" />
              </Link>
            )}
            <span className="text-muted-foreground text-sm">/</span>
            <Link href={docsHref("/docs")} className="text-sm font-medium text-primary hover:underline">
              Docs
            </Link>
          </div>
          <div className="flex items-center gap-3">
            {isDocsSubdomain ? (
              <a href="https://skillhub.space/browse">
                <Button variant="ghost" size="sm" className="hidden sm:flex">
                  Browse Skills
                </Button>
              </a>
            ) : (
              <Link href="/browse">
                <Button variant="ghost" size="sm" className="hidden sm:flex">
                  Browse Skills
                </Button>
              </Link>
            )}
            {user ? (
              <Link href="/">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Dashboard
                </Button>
              </Link>
            ) : (
              <Dialog open={authOpen} onOpenChange={setAuthOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">Sign In</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md p-0 overflow-hidden">
                  <AuthForms onSuccess={() => setAuthOpen(false)} />
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>
      </nav>

      <div className="max-w-screen-2xl mx-auto flex">
        <aside
          className={`fixed lg:sticky top-14 left-0 z-40 h-[calc(100vh-3.5rem)] w-72 border-r bg-background overflow-y-auto transition-transform lg:translate-x-0 ${
            mobileNavOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="p-4">
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search docs..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-9 h-9 text-sm"
              />
              {showSearch && searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-popover border rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
                  {searchResults.map((result) => (
                    <Link
                      key={result.href}
                      href={result.href}
                      onClick={() => {
                        setShowSearch(false);
                        setSearchQuery("");
                        setMobileNavOpen(false);
                      }}
                    >
                      <div className="px-3 py-2 hover:bg-muted cursor-pointer text-sm">
                        <div className="font-medium">{result.title}</div>
                        <div className="text-xs text-muted-foreground">
                          {(result as any).section}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
            <nav className="space-y-1">
              {navItems.map((item) => (
                <NavSection key={item.href} item={item} canonicalPath={canonicalPath} />
              ))}
            </nav>
          </div>
        </aside>

        {mobileNavOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/50 lg:hidden"
            onClick={() => setMobileNavOpen(false)}
          />
        )}

        <main className="flex-1 min-w-0">
          <div className="max-w-3xl mx-auto px-6 py-10">
            <div className="mb-8">
              <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
              {description && (
                <p className="mt-2 text-lg text-muted-foreground">{description}</p>
              )}
            </div>

            <div className="prose prose-neutral dark:prose-invert max-w-none
              prose-headings:scroll-mt-20
              prose-h2:text-xl prose-h2:font-semibold prose-h2:mt-10 prose-h2:mb-4 prose-h2:border-b prose-h2:pb-2
              prose-h3:text-lg prose-h3:font-medium prose-h3:mt-8 prose-h3:mb-3
              prose-p:leading-7 prose-p:mb-4
              prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:font-mono prose-code:before:content-none prose-code:after:content-none
              prose-pre:bg-[hsl(222,47%,8%)] prose-pre:border prose-pre:rounded-lg prose-pre:p-4
              prose-li:mb-1
              prose-a:text-primary prose-a:no-underline hover:prose-a:underline
              prose-strong:text-foreground
              prose-table:text-sm
              prose-th:bg-muted prose-th:px-4 prose-th:py-2
              prose-td:px-4 prose-td:py-2 prose-td:border-t
            ">
              {children}
            </div>

            <div className="flex justify-between items-center mt-16 pt-6 border-t">
              {prevPage ? (
                <Link href={prevPage.href}>
                  <div className="group flex flex-col items-start cursor-pointer">
                    <span className="text-xs text-muted-foreground mb-1">Previous</span>
                    <span className="text-sm font-medium text-primary group-hover:underline">
                      ← {prevPage.title}
                    </span>
                  </div>
                </Link>
              ) : (
                <div />
              )}
              {nextPage ? (
                <Link href={nextPage.href}>
                  <div className="group flex flex-col items-end cursor-pointer">
                    <span className="text-xs text-muted-foreground mb-1">Next</span>
                    <span className="text-sm font-medium text-primary group-hover:underline">
                      {nextPage.title} →
                    </span>
                  </div>
                </Link>
              ) : (
                <div />
              )}
            </div>
          </div>
        </main>
      </div>
      <footer className="border-t bg-muted/30 py-8">
        <div className="container px-4 text-center text-sm text-muted-foreground flex items-center justify-center gap-3">
          <p>&copy; 2026 SkillHub. All rights reserved. Created by 0BL1V1ON AI</p>
          <a href="https://x.com/skillhubspace" target="_blank" rel="noopener noreferrer" className="text-muted-foreground/60 hover:text-foreground transition-colors" aria-label="Follow us on X">
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
          </a>
        </div>
      </footer>
    </div>
  );
}
