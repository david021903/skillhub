import type { ComponentType } from "react";
import {
  BookOpen,
  Bot,
  FileText,
  FolderOpen,
  Globe,
  Home,
  Key,
  Package,
  Settings,
  ShieldCheck,
  Sparkles,
  Star,
  Terminal,
  User,
  Wand2,
} from "@/components/ui/icons";

export type GlobalSearchCategory = "page" | "doc";

export interface GlobalSearchIndexItem {
  id: string;
  kind: GlobalSearchCategory;
  title: string;
  href: string;
  description: string;
  section: string;
  keywords?: string[];
  icon: ComponentType<{ className?: string }>;
}

export const docsSearchEntries: GlobalSearchIndexItem[] = [
  {
    id: "doc-getting-started",
    kind: "doc",
    title: "What is SkillHub?",
    href: "/docs",
    description: "Learn what the TraderClaw Skills registry is and how the platform works.",
    section: "Getting Started",
    keywords: ["skills", "registry", "overview", "introduction"],
    icon: BookOpen,
  },
  {
    id: "doc-quick-start",
    kind: "doc",
    title: "Quick Start",
    href: "/docs/quick-start",
    description: "Create, publish, and install your first skill in a few minutes.",
    section: "Getting Started",
    keywords: ["first skill", "getting started", "publish", "install"],
    icon: BookOpen,
  },
  {
    id: "doc-account",
    kind: "doc",
    title: "Creating an Account",
    href: "/docs/account",
    description: "Set up your TraderClaw Skills account and configure your public profile.",
    section: "Getting Started",
    keywords: ["sign up", "account", "profile", "username"],
    icon: BookOpen,
  },
  {
    id: "doc-skill-format-overview",
    kind: "doc",
    title: "SKILL.md Format Overview",
    href: "/docs/skill-format",
    description: "Understand the required structure for SKILL.md files and published skills.",
    section: "SKILL.md Format",
    keywords: ["skill.md", "format", "manifest", "markdown"],
    icon: FileText,
  },
  {
    id: "doc-skill-format-frontmatter",
    kind: "doc",
    title: "YAML Frontmatter",
    href: "/docs/skill-format/frontmatter",
    description: "Learn how to define metadata, tags, dependencies, and permissions.",
    section: "SKILL.md Format",
    keywords: ["yaml", "frontmatter", "metadata", "tags", "dependencies"],
    icon: FileText,
  },
  {
    id: "doc-skill-format-body",
    kind: "doc",
    title: "Markdown Body",
    href: "/docs/skill-format/body",
    description: "Write clear instructions, usage notes, and behavior guidance for agents.",
    section: "SKILL.md Format",
    keywords: ["markdown", "instructions", "usage", "body"],
    icon: FileText,
  },
  {
    id: "doc-skill-format-examples",
    kind: "doc",
    title: "Examples",
    href: "/docs/skill-format/examples",
    description: "See complete examples of well-structured skills ready for publication.",
    section: "SKILL.md Format",
    keywords: ["examples", "templates", "sample", "skill.md"],
    icon: FileText,
  },
  {
    id: "doc-platform-browse",
    kind: "doc",
    title: "Browsing Skills",
    href: "/docs/platform",
    description: "Explore the registry, compare validation, and discover new skills.",
    section: "Web Platform",
    keywords: ["browse", "search", "discover", "registry"],
    icon: Globe,
  },
  {
    id: "doc-platform-publishing",
    kind: "doc",
    title: "Publishing Skills",
    href: "/docs/platform/publishing",
    description: "Publish skills through the web platform with validation and version tracking.",
    section: "Web Platform",
    keywords: ["publish", "web platform", "create", "release"],
    icon: Globe,
  },
  {
    id: "doc-platform-versions",
    kind: "doc",
    title: "Version Management",
    href: "/docs/platform/versions",
    description: "Manage releases, version history, and updates across your skills.",
    section: "Web Platform",
    keywords: ["versions", "releases", "history", "updates"],
    icon: Globe,
  },
  {
    id: "doc-platform-collaboration",
    kind: "doc",
    title: "Issues & Pull Requests",
    href: "/docs/platform/collaboration",
    description: "Use discussions, issues, and pull requests to collaborate on skills.",
    section: "Web Platform",
    keywords: ["issues", "pull requests", "collaboration", "review"],
    icon: Globe,
  },
  {
    id: "doc-platform-forking",
    kind: "doc",
    title: "Forking",
    href: "/docs/platform/forking",
    description: "Fork existing skills and create your own versions safely.",
    section: "Web Platform",
    keywords: ["fork", "clone", "versions", "ownership"],
    icon: Globe,
  },
  {
    id: "doc-cli-installation",
    kind: "doc",
    title: "Installation",
    href: "/docs/cli",
    description: "Install the CLI and start working with skills from the command line.",
    section: "CLI",
    keywords: ["cli", "installation", "tcs", "npm"],
    icon: Terminal,
  },
  {
    id: "doc-cli-auth",
    kind: "doc",
    title: "Authentication",
    href: "/docs/cli/auth",
    description: "Authenticate the CLI with your account and API token.",
    section: "CLI",
    keywords: ["cli", "auth", "token", "login"],
    icon: Terminal,
  },
  {
    id: "doc-cli-publish-install",
    kind: "doc",
    title: "Publishing & Installing",
    href: "/docs/cli/publish-install",
    description: "Publish skills or install existing ones directly from the terminal.",
    section: "CLI",
    keywords: ["publish", "install", "cli", "terminal"],
    icon: Terminal,
  },
  {
    id: "doc-cli-search",
    kind: "doc",
    title: "Search & Browse",
    href: "/docs/cli/search",
    description: "Search registry skills from the CLI and browse results efficiently.",
    section: "CLI",
    keywords: ["search", "browse", "cli", "registry"],
    icon: Terminal,
  },
  {
    id: "doc-cli-validation",
    kind: "doc",
    title: "Validation",
    href: "/docs/cli/validation",
    description: "Validate SKILL.md files locally before publishing.",
    section: "CLI",
    keywords: ["validation", "lint", "skill.md", "cli"],
    icon: Terminal,
  },
  {
    id: "doc-cli-templates",
    kind: "doc",
    title: "Templates",
    href: "/docs/cli/templates",
    description: "Start from templates and accelerate new skill creation.",
    section: "CLI",
    keywords: ["templates", "scaffold", "starter", "cli"],
    icon: Terminal,
  },
  {
    id: "doc-cli-dependencies",
    kind: "doc",
    title: "Dependency Checking",
    href: "/docs/cli/dependencies",
    description: "Check dependencies, tools, and runtime requirements for skills.",
    section: "CLI",
    keywords: ["dependencies", "bins", "env", "requirements"],
    icon: Terminal,
  },
  {
    id: "doc-validation-overview",
    kind: "doc",
    title: "How It Works",
    href: "/docs/validation",
    description: "Understand validation scoring and how skill health is calculated.",
    section: "Validation & Scoring",
    keywords: ["validation", "score", "health", "checks"],
    icon: ShieldCheck,
  },
  {
    id: "doc-validation-criteria",
    kind: "doc",
    title: "Scoring Criteria",
    href: "/docs/validation/criteria",
    description: "See which checks impact your score and how each category is weighted.",
    section: "Validation & Scoring",
    keywords: ["criteria", "score", "validation", "checks"],
    icon: ShieldCheck,
  },
  {
    id: "doc-validation-improving",
    kind: "doc",
    title: "Improving Your Score",
    href: "/docs/validation/improving",
    description: "Raise your skill health score with practical improvements and examples.",
    section: "Validation & Scoring",
    keywords: ["improve", "score", "quality", "best practices"],
    icon: ShieldCheck,
  },
  {
    id: "doc-ai-overview",
    kind: "doc",
    title: "AI Features Overview",
    href: "/docs/ai",
    description: "Explore the AI features available inside the TraderClaw Skills platform.",
    section: "AI Features",
    keywords: ["ai", "features", "overview", "assistant"],
    icon: Bot,
  },
  {
    id: "doc-ai-explainer",
    kind: "doc",
    title: "Skill Explainer",
    href: "/docs/ai/explainer",
    description: "Use AI to explain what a skill does and how to use it correctly.",
    section: "AI Features",
    keywords: ["ai", "explainer", "summary", "understand"],
    icon: Bot,
  },
  {
    id: "doc-ai-generator",
    kind: "doc",
    title: "Skill Generator",
    href: "/docs/ai/generator",
    description: "Generate new skill drafts from prompts and refine them before publishing.",
    section: "AI Features",
    keywords: ["ai", "generator", "create", "draft"],
    icon: Bot,
  },
  {
    id: "doc-ai-chat",
    kind: "doc",
    title: "Skill Chat",
    href: "/docs/ai/chat",
    description: "Ask questions about skills and get contextual help from the platform.",
    section: "AI Features",
    keywords: ["ai", "chat", "assistant", "questions"],
    icon: Bot,
  },
  {
    id: "doc-tokens-overview",
    kind: "doc",
    title: "API Tokens Overview",
    href: "/docs/tokens",
    description: "Understand API tokens, scopes, and using the platform programmatically.",
    section: "API Tokens",
    keywords: ["tokens", "api", "auth", "permissions"],
    icon: Key,
  },
  {
    id: "doc-tokens-creating",
    kind: "doc",
    title: "Creating Tokens",
    href: "/docs/tokens/creating",
    description: "Create a new API token and safely use it in local workflows.",
    section: "API Tokens",
    keywords: ["create", "token", "api", "auth"],
    icon: Key,
  },
  {
    id: "doc-tokens-scopes",
    kind: "doc",
    title: "Scopes & Permissions",
    href: "/docs/tokens/scopes",
    description: "Choose the right access scopes for scripts, publishing, and installs.",
    section: "API Tokens",
    keywords: ["scopes", "permissions", "api", "token"],
    icon: Key,
  },
  {
    id: "doc-tokens-cli",
    kind: "doc",
    title: "Using with CLI",
    href: "/docs/tokens/cli-usage",
    description: "Authenticate the CLI using a token and work securely from the terminal.",
    section: "API Tokens",
    keywords: ["cli", "token", "api", "auth"],
    icon: Key,
  },
];

export function buildPageSearchEntries(options: {
  userHandle?: string;
  isAdmin?: boolean;
}): GlobalSearchIndexItem[] {
  const { userHandle, isAdmin = false } = options;

  const entries: GlobalSearchIndexItem[] = [
    {
      id: "page-dashboard",
      kind: "page",
      title: "Dashboard",
      href: "/",
      description: "Return to your main TraderClaw Skills workspace and recent activity.",
      section: "Workspace",
      keywords: ["home", "dashboard", "workspace"],
      icon: Home,
    },
    {
      id: "page-browse",
      kind: "page",
      title: "Browse Skills",
      href: "/browse",
      description: "Explore the registry, search by tag, and sort skills by momentum or popularity.",
      section: "Workspace",
      keywords: ["browse", "discover", "skills", "search"],
      icon: Package,
    },
    {
      id: "page-my-skills",
      kind: "page",
      title: "My Skills",
      href: "/my-skills",
      description: "Manage your published skills, versions, and registry presence.",
      section: "Workspace",
      keywords: ["my skills", "published", "manage", "versions"],
      icon: FolderOpen,
    },
    {
      id: "page-starred",
      kind: "page",
      title: "Starred",
      href: "/starred",
      description: "Revisit saved skills and remove or compare them quickly.",
      section: "Workspace",
      keywords: ["starred", "saved", "favorites"],
      icon: Star,
    },
    {
      id: "page-create-skill",
      kind: "page",
      title: "Create New Skill",
      href: "/new",
      description: "Use the wizard to create, structure, and publish a new skill.",
      section: "Workspace",
      keywords: ["new skill", "create", "publish", "wizard"],
      icon: Package,
    },
    {
      id: "page-validate",
      kind: "page",
      title: "Validate SKILL.md",
      href: "/validate",
      description: "Run validation checks and improve the overall health score of a skill.",
      section: "Workspace",
      keywords: ["validate", "skill.md", "health", "score"],
      icon: ShieldCheck,
    },
    {
      id: "page-ai-generator",
      kind: "page",
      title: "AI Generator",
      href: "/generate",
      description: "Generate a skill draft with AI and move it into a publish-ready flow.",
      section: "Workspace",
      keywords: ["ai", "generator", "draft", "wizard"],
      icon: Wand2,
    },
    {
      id: "page-profile",
      kind: "page",
      title: "Your Profile",
      href: userHandle ? `/users/${userHandle}` : "/profile",
      description: "View your public profile, profile image, and personal registry stats.",
      section: "Account",
      keywords: ["profile", "user", "public profile", "stats"],
      icon: User,
    },
    {
      id: "page-settings",
      kind: "page",
      title: "Settings",
      href: "/settings",
      description: "Manage your public profile details, username, and account settings.",
      section: "Account",
      keywords: ["settings", "profile", "account", "username"],
      icon: Settings,
    },
    {
      id: "page-api-tokens",
      kind: "page",
      title: "API Tokens",
      href: "/settings/tokens",
      description: "Create, review, and revoke API tokens for CLI and integrations.",
      section: "Account",
      keywords: ["tokens", "api", "auth", "cli"],
      icon: Key,
    },
    {
      id: "page-ai-features",
      kind: "page",
      title: "AI Features",
      href: "/settings/ai",
      description: "Configure your AI settings and review available AI-powered tools.",
      section: "Account",
      keywords: ["ai", "features", "settings", "assistant"],
      icon: Sparkles,
    },
    {
      id: "page-docs",
      kind: "page",
      title: "Skills Docs",
      href: "/docs",
      description: "Open the developer docs for publishing, validation, CLI, and APIs.",
      section: "Resources",
      keywords: ["docs", "documentation", "guide", "developer"],
      icon: BookOpen,
    },
  ];

  if (isAdmin) {
    entries.push({
      id: "page-admin",
      kind: "page",
      title: "Admin Dashboard",
      href: "/admin",
      description: "Access internal moderation and administration tooling.",
      section: "Workspace",
      keywords: ["admin", "moderation", "dashboard"],
      icon: ShieldCheck,
    });
  }

  return entries;
}

function scoreItem(item: GlobalSearchIndexItem, query: string) {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return 1;
  }

  const title = item.title.toLowerCase();
  const description = item.description.toLowerCase();
  const section = item.section.toLowerCase();
  const keywords = (item.keywords || []).join(" ").toLowerCase();

  let score = 0;

  if (title === normalizedQuery) score += 220;
  if (title.startsWith(normalizedQuery)) score += 140;
  if (title.includes(normalizedQuery)) score += 110;
  if (section.includes(normalizedQuery)) score += 70;
  if (keywords.includes(normalizedQuery)) score += 60;
  if (description.includes(normalizedQuery)) score += 40;

  const queryTerms = normalizedQuery.split(/\s+/).filter(Boolean);
  for (const term of queryTerms) {
    if (title.includes(term)) score += 18;
    if (keywords.includes(term)) score += 12;
    if (description.includes(term)) score += 8;
    if (section.includes(term)) score += 8;
  }

  return score;
}

export function filterGlobalSearchEntries(items: GlobalSearchIndexItem[], query: string) {
  const normalizedQuery = query.trim().toLowerCase();

  return items
    .map((item) => ({ item, score: scoreItem(item, normalizedQuery) }))
    .filter(({ score }) => score > 0)
    .sort((left, right) => right.score - left.score || left.item.title.localeCompare(right.item.title))
    .map(({ item }) => item);
}
