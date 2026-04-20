import { skillTemplates } from "@/lib/skill-templates";

type ValidationStatus = "passed" | "failed" | "warning" | "skipped";

interface MockUserRecord {
  id: string;
  email: string;
  handle: string;
  firstName: string;
  lastName: string;
  bio: string;
  profileImageUrl: string | null;
  hasOpenaiKey: boolean;
  isAdmin: boolean;
  createdAt: string;
  updatedAt: string;
}

interface MockValidationCheck {
  id: string;
  category: string;
  status: ValidationStatus;
  message: string;
}

interface MockValidationRecord {
  id: string;
  status: "passed" | "failed";
  score: number;
  checks: MockValidationCheck[];
}

interface MockFileRecord {
  id: string;
  path: string;
  content: string;
  size: number;
  isBinary: boolean;
  mimeType: string;
  createdAt: string;
}

interface MockVersionRecord {
  id: string;
  version: string;
  isLatest: boolean;
  isYanked: boolean;
  publishedAt: string;
  downloads: number;
  changelog: string;
  skillMd: string;
  validations: MockValidationRecord[];
  files: MockFileRecord[];
}

interface MockSkillRecord {
  id: string;
  name: string;
  slug: string;
  description: string;
  isVerified: boolean;
  isArchived: boolean;
  license: string;
  stars: number;
  downloads: number;
  weeklyDownloads: number;
  forks: number;
  tags: string[];
  repository: string | null;
  homepage: string | null;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  versions: MockVersionRecord[];
}

interface MockCommentRecord {
  id: string;
  skillId: string;
  content: string;
  parentId: string | null;
  isEdited: boolean;
  createdAt: string;
  userId: string;
}

interface MockIssueRecord {
  id: string;
  skillId: string;
  number: number;
  title: string;
  body: string;
  state: "open" | "closed";
  authorId: string;
  createdAt: string;
}

interface MockPullRecord {
  id: string;
  skillId: string;
  number: number;
  title: string;
  body: string;
  state: "open" | "merged" | "closed";
  authorId: string;
  createdAt: string;
  proposedSkillMd: string;
}

interface MockActivityRecord {
  id: string;
  skillId: string;
  action: string;
  details?: Record<string, unknown>;
  createdAt: string;
  userId?: string;
}

interface MockTokenRecord {
  id: string;
  userId: string;
  name: string;
  token: string;
  scopes: string[];
  lastUsedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
}

interface MockState {
  nextId: number;
  sessionUserId: string | null;
  users: MockUserRecord[];
  skills: MockSkillRecord[];
  comments: MockCommentRecord[];
  issues: MockIssueRecord[];
  pulls: MockPullRecord[];
  activities: MockActivityRecord[];
  tokens: MockTokenRecord[];
  starsByUserId: Record<string, string[]>;
}

declare global {
  interface Window {
    __SKILLHUB_FRONTEND_ONLY_INSTALLED__?: boolean;
    __SKILLHUB_FRONTEND_ONLY_STATE__?: MockState;
    __SKILLHUB_FRONTEND_ONLY_FETCH__?: typeof fetch;
  }
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

function nowIso() {
  return new Date().toISOString();
}

function createSkillMd(name: string, description: string, tags: string[], extraSections: string[] = []) {
  const normalizedName = name.toLowerCase().replace(/\s+/g, "-");
  const primaryTag = tags[0] || "workflow";

  return `---
name: ${normalizedName}
description: ${description}
metadata:
  openclaw:
    requires:
      bins:
        - curl
        - jq
      env:
        - ${primaryTag.toUpperCase()}_API_KEY
---

# ${name}

## Overview
${description}

## Capabilities
- Collect structured inputs for ${primaryTag} workflows
- Produce operator-readable output with compact summaries
- Keep decisions auditable for follow-up actions

## Permissions & Safety
- Network access only when fetching required market context
- Never writes outside the current workspace without permission
- Redacts secrets from generated logs and summaries

## Usage Examples
\`\`\`bash
${normalizedName} --symbol BTCUSD --window 4h
\`\`\`

${extraSections.join("\n\n")}
`;
}

function createFile(path: string, content: string, mimeType = "text/plain"): MockFileRecord {
  return {
    id: `file_${path.replace(/[^a-z0-9]/gi, "_").toLowerCase()}`,
    path,
    content,
    size: content.length,
    isBinary: false,
    mimeType,
    createdAt: nowIso(),
  };
}

function createValidation(score: number, checks: MockValidationCheck[]): MockValidationRecord {
  return {
    id: `validation_${Math.round(score)}`,
    status: checks.some((check) => check.status === "failed") ? "failed" : "passed",
    score,
    checks,
  };
}

function createVersion(
  version: string,
  publishedAt: string,
  downloads: number,
  skillMd: string,
  changelog: string,
  checks: MockValidationCheck[],
  extraFiles: Array<{ path: string; content: string; mimeType?: string }> = [],
): MockVersionRecord {
  const files = [
    createFile("SKILL.md", skillMd, "text/markdown"),
    ...extraFiles.map((file) => createFile(file.path, file.content, file.mimeType)),
  ];

  const passedChecks = checks.filter((check) => check.status === "passed").length;
  const warningChecks = checks.filter((check) => check.status === "warning").length;
  const score = Math.round(((passedChecks + warningChecks * 0.5) / Math.max(checks.length, 1)) * 100);

  return {
    id: `version_${version.replace(/\./g, "_")}`,
    version,
    isLatest: false,
    isYanked: false,
    publishedAt,
    downloads,
    changelog,
    skillMd,
    validations: [createValidation(score, checks)],
    files,
  };
}

function latestVersion(skill: MockSkillRecord) {
  return [...skill.versions].sort((left, right) => {
    return new Date(right.publishedAt).getTime() - new Date(left.publishedAt).getTime();
  })[0];
}

function skillValidationScore(skill: MockSkillRecord) {
  return latestVersion(skill)?.validations?.[0]?.score ?? 0;
}

function seedState(): MockState {
  const createdAt = "2026-04-18T09:00:00.000Z";
  const updatedAt = "2026-04-20T08:30:00.000Z";

  const users: MockUserRecord[] = [
    {
      id: "user_roman",
      email: "roman@bsns.ch",
      handle: "roman",
      firstName: "Roman",
      lastName: "B",
      bio: "Building the Traderclaw registry surface and tightening the operator workflow.",
      profileImageUrl: null,
      hasOpenaiKey: true,
      isAdmin: false,
      createdAt,
      updatedAt,
    },
    {
      id: "user_skillhub",
      email: "ops@skillhub.space",
      handle: "skillhub",
      firstName: "SkillHub",
      lastName: "Ops",
      bio: "Official registry curation, validation rules, and publishing standards.",
      profileImageUrl: null,
      hasOpenaiKey: false,
      isAdmin: false,
      createdAt,
      updatedAt,
    },
    {
      id: "user_nina",
      email: "nina@apex.example",
      handle: "apexnina",
      firstName: "Nina",
      lastName: "Apex",
      bio: "Trading ops lead focused on risk protocols and execution discipline.",
      profileImageUrl: null,
      hasOpenaiKey: true,
      isAdmin: false,
      createdAt,
      updatedAt,
    },
    {
      id: "user_mason",
      email: "mason@quant.example",
      handle: "quantmason",
      firstName: "Mason",
      lastName: "Quant",
      bio: "News and macro workflow designer shipping signal-aware skills.",
      profileImageUrl: null,
      hasOpenaiKey: false,
      isAdmin: false,
      createdAt,
      updatedAt,
    },
    {
      id: "user_autumn",
      email: "autumn@flux.example",
      handle: "autumnflux",
      firstName: "Autumn",
      lastName: "Flux",
      bio: "Documentation-heavy systems thinker keeping operator context clean.",
      profileImageUrl: null,
      hasOpenaiKey: true,
      isAdmin: false,
      createdAt,
      updatedAt,
    },
  ];

  const marketStructureMd = createSkillMd(
    "Market Structure Scout",
    "Maps structure breaks, liquidity zones, and session bias into a concise operator brief.",
    ["trading", "analysis", "market-structure"],
    [
      "## Signals\n- Session bias\n- Key sweep zones\n- Liquidity targets",
      "## Outputs\n- A compact narrative summary\n- Bullet checkpoints for execution planning",
    ],
  );
  const marketStructureChecks: MockValidationCheck[] = [
    { id: "manifest_name", category: "manifest", status: "passed", message: "Frontmatter includes a valid name." },
    { id: "manifest_description", category: "manifest", status: "passed", message: "Description is present and concise." },
    { id: "skill_body", category: "skillmd", status: "passed", message: "Skill includes overview and usage guidance." },
    { id: "security_scope", category: "security", status: "warning", message: "Uses network access for optional context fetches." },
    { id: "compat_bins", category: "compat", status: "passed", message: "Dependency declarations are compatible with current runtime." },
  ];

  const macroCalendarMd = createSkillMd(
    "Macro Calendar Radar",
    "Tracks high-volatility macro events and prepares a pre-event checklist for traders.",
    ["macro", "calendar", "risk"],
    [
      "## Workflow\n- Pull the latest economic calendar\n- Highlight high-impact releases\n- Produce a pre-event risk note",
    ],
  );
  const macroCalendarChecks: MockValidationCheck[] = [
    { id: "manifest_name", category: "manifest", status: "passed", message: "Frontmatter name is valid." },
    { id: "manifest_description", category: "manifest", status: "passed", message: "Description is present." },
    { id: "skill_body", category: "skillmd", status: "passed", message: "Skill includes clear operator instructions." },
    { id: "security_scope", category: "security", status: "passed", message: "No unnecessary elevated permissions detected." },
    { id: "compat_bins", category: "compat", status: "passed", message: "Declared binaries match supported runtime set." },
  ];

  const newsWireMd = createSkillMd(
    "News Sentiment Wire",
    "Condenses breaking market headlines into bias, risk, and actionability notes.",
    ["news", "sentiment", "macro"],
    [
      "## Inputs\n- Headlines feed\n- Watchlist symbols\n- Event tags",
    ],
  );
  const newsWireChecks: MockValidationCheck[] = [
    { id: "manifest_name", category: "manifest", status: "passed", message: "Frontmatter name is valid." },
    { id: "manifest_description", category: "manifest", status: "passed", message: "Description is present." },
    { id: "skill_body", category: "skillmd", status: "passed", message: "Skill includes overview and usage examples." },
    { id: "security_scope", category: "security", status: "warning", message: "External feeds require API credentials." },
    { id: "compat_bins", category: "compat", status: "passed", message: "Dependencies are supported." },
  ];

  const riskChecklistMd = createSkillMd(
    "Risk Ops Checklist",
    "Standardizes position sizing, invalidation, and stop management before any order is placed.",
    ["risk", "checklist", "execution"],
    [
      "## Checklist\n- Thesis\n- Invalidations\n- Max loss\n- Scaling conditions",
    ],
  );
  const riskChecklistChecks: MockValidationCheck[] = [
    { id: "manifest_name", category: "manifest", status: "passed", message: "Frontmatter name is valid." },
    { id: "manifest_description", category: "manifest", status: "passed", message: "Description is present." },
    { id: "skill_body", category: "skillmd", status: "passed", message: "Skill is readable and complete." },
    { id: "security_scope", category: "security", status: "passed", message: "No unsafe permission scope detected." },
    { id: "compat_bins", category: "compat", status: "passed", message: "No unsupported dependencies detected." },
  ];

  const journalSyncMd = createSkillMd(
    "Execution Journal Sync",
    "Turns fills, notes, and screenshots into a structured session journal entry.",
    ["journal", "review", "workflow"],
    [
      "## Outputs\n- Session recap\n- Execution scorecard\n- Follow-up actions",
    ],
  );
  const journalSyncChecks: MockValidationCheck[] = [
    { id: "manifest_name", category: "manifest", status: "passed", message: "Frontmatter name is valid." },
    { id: "manifest_description", category: "manifest", status: "passed", message: "Description is present." },
    { id: "skill_body", category: "skillmd", status: "passed", message: "Skill body is comprehensive." },
    { id: "security_scope", category: "security", status: "warning", message: "Review outputs may include sensitive notes if not sanitized." },
    { id: "compat_bins", category: "compat", status: "passed", message: "Dependencies are compatible." },
  ];

  const skills: MockSkillRecord[] = [
    {
      id: "skill_market_structure_scout",
      name: "Market Structure Scout",
      slug: "market-structure-scout",
      description: "Maps structure breaks, liquidity zones, and session bias into a concise operator brief.",
      isVerified: true,
      isArchived: false,
      license: "MIT",
      stars: 148,
      downloads: 3041,
      weeklyDownloads: 412,
      forks: 18,
      tags: ["trading", "analysis", "market-structure"],
      repository: "https://github.com/Apex-Traderclaw/skillhub",
      homepage: "https://skillhub.space",
      ownerId: "user_roman",
      createdAt: "2026-03-10T08:00:00.000Z",
      updatedAt,
      versions: [
        createVersion(
          "1.4.2",
          "2026-04-18T06:15:00.000Z",
          1140,
          marketStructureMd,
          "Refined session bias logic and tightened output formatting for faster scanning.",
          marketStructureChecks,
          [
            { path: "prompts/session-bias.txt", content: "Summarize session bias in three bullets.\nEmphasize liquidity.\nHighlight invalidation." },
            { path: "config/defaults.json", content: JSON.stringify({ window: "4h", sessions: ["london", "new-york"] }, null, 2), mimeType: "application/json" },
            { path: "examples/report.md", content: "# Example Report\n\n- Bias: bullish\n- Sweep zone: 64200\n- Invalidation: 63640", mimeType: "text/markdown" },
          ],
        ),
        createVersion(
          "1.4.0",
          "2026-04-02T08:30:00.000Z",
          912,
          marketStructureMd.replace("session bias", "market bias"),
          "Introduced structure sweep detection and cleaner output layout.",
          marketStructureChecks,
          [
            { path: "prompts/session-bias.txt", content: "Summarize directional bias and risk." },
            { path: "examples/report.md", content: "# Example Report\n\n- Bias: neutral\n- Sweep zone: 62880", mimeType: "text/markdown" },
          ],
        ),
      ],
    },
    {
      id: "skill_macro_calendar_radar",
      name: "Macro Calendar Radar",
      slug: "macro-calendar-radar",
      description: "Tracks high-volatility macro events and prepares a pre-event checklist for traders.",
      isVerified: true,
      isArchived: false,
      license: "Apache-2.0",
      stars: 207,
      downloads: 5290,
      weeklyDownloads: 508,
      forks: 11,
      tags: ["macro", "calendar", "risk"],
      repository: "https://github.com/Apex-Traderclaw/skillhub",
      homepage: "https://skillhub.space/docs",
      ownerId: "user_skillhub",
      createdAt: "2026-02-20T11:00:00.000Z",
      updatedAt,
      versions: [
        createVersion(
          "2.1.0",
          "2026-04-16T07:00:00.000Z",
          1890,
          macroCalendarMd,
          "Added risk posture presets for CPI, FOMC, NFP, and earnings clusters.",
          macroCalendarChecks,
          [
            { path: "events/high-impact.yaml", content: "events:\n  - CPI\n  - FOMC\n  - NFP", mimeType: "application/yaml" },
            { path: "README.md", content: "# Macro Calendar Radar\n\nOfficial SkillHub release for macro event prep.", mimeType: "text/markdown" },
          ],
        ),
      ],
    },
    {
      id: "skill_news_sentiment_wire",
      name: "News Sentiment Wire",
      slug: "news-sentiment-wire",
      description: "Condenses breaking market headlines into bias, risk, and actionability notes.",
      isVerified: true,
      isArchived: false,
      license: "MIT",
      stars: 126,
      downloads: 2475,
      weeklyDownloads: 360,
      forks: 9,
      tags: ["news", "sentiment", "macro"],
      repository: "https://github.com/Apex-Traderclaw/skillhub",
      homepage: null,
      ownerId: "user_mason",
      createdAt: "2026-03-22T13:30:00.000Z",
      updatedAt,
      versions: [
        createVersion(
          "0.9.7",
          "2026-04-14T10:15:00.000Z",
          840,
          newsWireMd,
          "Improved headline clustering and event-risk annotations.",
          newsWireChecks,
          [
            { path: "feeds/default.json", content: JSON.stringify({ sources: ["Bloomberg", "Reuters", "The Block"] }, null, 2), mimeType: "application/json" },
            { path: "examples/sentiment-brief.md", content: "# Sentiment Brief\n\n- Tone: mixed\n- Risk: elevated", mimeType: "text/markdown" },
          ],
        ),
      ],
    },
    {
      id: "skill_risk_ops_checklist",
      name: "Risk Ops Checklist",
      slug: "risk-ops-checklist",
      description: "Standardizes position sizing, invalidation, and stop management before any order is placed.",
      isVerified: true,
      isArchived: false,
      license: "MIT",
      stars: 182,
      downloads: 4110,
      weeklyDownloads: 295,
      forks: 14,
      tags: ["risk", "checklist", "execution"],
      repository: "https://github.com/Apex-Traderclaw/skillhub",
      homepage: null,
      ownerId: "user_nina",
      createdAt: "2026-03-04T15:00:00.000Z",
      updatedAt,
      versions: [
        createVersion(
          "1.1.3",
          "2026-04-11T08:45:00.000Z",
          1265,
          riskChecklistMd,
          "Expanded invalidation presets and added journaling prompts.",
          riskChecklistChecks,
          [
            { path: "checklists/futures.md", content: "- Max loss\n- Position size\n- Event risk window", mimeType: "text/markdown" },
            { path: "checklists/options.md", content: "- IV conditions\n- Time decay plan\n- Exit ladder", mimeType: "text/markdown" },
          ],
        ),
      ],
    },
    {
      id: "skill_execution_journal_sync",
      name: "Execution Journal Sync",
      slug: "execution-journal-sync",
      description: "Turns fills, notes, and screenshots into a structured session journal entry.",
      isVerified: false,
      isArchived: false,
      license: "MIT",
      stars: 88,
      downloads: 1736,
      weeklyDownloads: 140,
      forks: 4,
      tags: ["journal", "review", "workflow"],
      repository: null,
      homepage: null,
      ownerId: "user_autumn",
      createdAt: "2026-03-28T12:00:00.000Z",
      updatedAt,
      versions: [
        createVersion(
          "0.6.4",
          "2026-04-09T09:20:00.000Z",
          590,
          journalSyncMd,
          "Improved recap formatting and screenshot annotation hints.",
          journalSyncChecks,
          [
            { path: "templates/session-review.md", content: "# Session Review\n\n## What happened\n\n## What I missed", mimeType: "text/markdown" },
            { path: "examples/review.json", content: JSON.stringify({ grade: "B+", emotions: ["calm", "rushed"] }, null, 2), mimeType: "application/json" },
          ],
        ),
      ],
    },
  ];

  for (const skill of skills) {
    skill.versions = skill.versions
      .sort((left, right) => new Date(right.publishedAt).getTime() - new Date(left.publishedAt).getTime())
      .map((version, index) => ({ ...version, isLatest: index === 0 }));
  }

  return {
    nextId: 1000,
    sessionUserId: "user_roman",
    users,
    skills,
    comments: [
      {
        id: "comment_1",
        skillId: "skill_market_structure_scout",
        content: "The compressed summary is great on mobile. I’d love an optional session overlap note too.",
        parentId: null,
        isEdited: false,
        createdAt: "2026-04-19T09:10:00.000Z",
        userId: "user_nina",
      },
      {
        id: "comment_2",
        skillId: "skill_market_structure_scout",
        content: "Added this to my pre-London workflow. Nice balance between signal and brevity.",
        parentId: null,
        isEdited: false,
        createdAt: "2026-04-19T12:45:00.000Z",
        userId: "user_mason",
      },
    ],
    issues: [
      {
        id: "issue_1",
        skillId: "skill_market_structure_scout",
        number: 14,
        title: "Session overlap note should be optional",
        body: "The output is great, but I only want overlap context on intraday runs.",
        state: "open",
        authorId: "user_nina",
        createdAt: "2026-04-18T12:00:00.000Z",
      },
      {
        id: "issue_2",
        skillId: "skill_macro_calendar_radar",
        number: 7,
        title: "Add ECB and BoJ event presets",
        body: "Would be useful to have non-US presets for cross-market desks.",
        state: "open",
        authorId: "user_mason",
        createdAt: "2026-04-17T13:20:00.000Z",
      },
    ],
    pulls: [
      {
        id: "pull_1",
        skillId: "skill_market_structure_scout",
        number: 6,
        title: "Refine liquidity language for sweep setups",
        body: "Tightens the wording around sweep confirmations and invalidation text.",
        state: "open",
        authorId: "user_autumn",
        createdAt: "2026-04-18T15:30:00.000Z",
        proposedSkillMd: marketStructureMd.replace("liquidity targets", "liquidity targets and sweep confirmations"),
      },
    ],
    activities: [
      {
        id: "activity_1",
        skillId: "skill_market_structure_scout",
        action: "publish",
        details: { version: "1.4.2" },
        createdAt: "2026-04-18T06:15:00.000Z",
        userId: "user_roman",
      },
      {
        id: "activity_2",
        skillId: "skill_market_structure_scout",
        action: "star",
        createdAt: "2026-04-18T09:45:00.000Z",
        userId: "user_nina",
      },
      {
        id: "activity_3",
        skillId: "skill_market_structure_scout",
        action: "comment",
        createdAt: "2026-04-19T09:10:00.000Z",
        userId: "user_nina",
      },
      {
        id: "activity_4",
        skillId: "skill_market_structure_scout",
        action: "fork",
        createdAt: "2026-04-19T18:00:00.000Z",
        userId: "user_autumn",
      },
    ],
    tokens: [
      {
        id: "token_1",
        userId: "user_roman",
        name: "Trading Laptop",
        token: "shp_live_preview_1a2b3c4d5e",
        scopes: ["read", "write", "publish"],
        lastUsedAt: "2026-04-18T08:00:00.000Z",
        expiresAt: null,
        createdAt: "2026-04-10T07:00:00.000Z",
      },
    ],
    starsByUserId: {
      user_roman: ["skill_macro_calendar_radar", "skill_risk_ops_checklist"],
      user_nina: ["skill_market_structure_scout"],
      user_mason: ["skill_macro_calendar_radar"],
    },
  };
}

function getState() {
  if (!window.__SKILLHUB_FRONTEND_ONLY_STATE__) {
    window.__SKILLHUB_FRONTEND_ONLY_STATE__ = seedState();
  }

  return window.__SKILLHUB_FRONTEND_ONLY_STATE__;
}

function nextId(state: MockState, prefix: string) {
  const value = `${prefix}_${state.nextId}`;
  state.nextId += 1;
  return value;
}

function getUserById(state: MockState, userId: string | undefined | null) {
  return state.users.find((user) => user.id === userId) ?? null;
}

function getSessionUser(state: MockState) {
  return getUserById(state, state.sessionUserId);
}

function toUserResponse(user: MockUserRecord) {
  return {
    id: user.id,
    email: user.email,
    password_hash: null,
    email_verified: true,
    first_name: user.firstName,
    last_name: user.lastName,
    profile_image_url: user.profileImageUrl,
    handle: user.handle,
    bio: user.bio,
    openai_api_key: user.hasOpenaiKey ? "configured" : null,
    is_admin: user.isAdmin,
    created_at: user.createdAt,
    updated_at: user.updatedAt,
    firstName: user.firstName,
    lastName: user.lastName,
    profileImageUrl: user.profileImageUrl,
    hasOpenaiKey: user.hasOpenaiKey,
    isAdmin: user.isAdmin,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

function toOwnerResponse(user: MockUserRecord | null) {
  if (!user) return null;

  return {
    id: user.id,
    handle: user.handle,
    firstName: user.firstName,
    lastName: user.lastName,
    profileImageUrl: user.profileImageUrl,
  };
}

function toVersionResponse(version: MockVersionRecord) {
  return {
    id: version.id,
    version: version.version,
    isLatest: version.isLatest,
    isYanked: version.isYanked,
    publishedAt: version.publishedAt,
    downloads: version.downloads,
    changelog: version.changelog,
    skillMd: version.skillMd,
    validations: clone(version.validations),
  };
}

function toSkillSummary(state: MockState, skill: MockSkillRecord) {
  const owner = getUserById(state, skill.ownerId);

  return {
    id: skill.id,
    name: skill.name,
    slug: skill.slug,
    description: skill.description,
    isVerified: skill.isVerified,
    isArchived: skill.isArchived,
    license: skill.license,
    stars: skill.stars,
    downloads: skill.downloads,
    weeklyDownloads: skill.weeklyDownloads,
    forks: skill.forks,
    tags: clone(skill.tags),
    repository: skill.repository,
    homepage: skill.homepage,
    ownerId: skill.ownerId,
    owner: toOwnerResponse(owner),
    validationScore: skillValidationScore(skill),
    createdAt: skill.createdAt,
    updatedAt: skill.updatedAt,
  };
}

function toSkillDetail(state: MockState, skill: MockSkillRecord) {
  return {
    ...toSkillSummary(state, skill),
    versions: skill.versions
      .slice()
      .sort((left, right) => new Date(right.publishedAt).getTime() - new Date(left.publishedAt).getTime())
      .map(toVersionResponse),
  };
}

function toCommentResponse(state: MockState, comment: MockCommentRecord) {
  const user = getUserById(state, comment.userId);

  return {
    id: comment.id,
    content: comment.content,
    parentId: comment.parentId,
    isEdited: comment.isEdited,
    createdAt: comment.createdAt,
    user: user
      ? {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          handle: user.handle,
          profileImageUrl: user.profileImageUrl,
        }
      : null,
  };
}

function toActivityResponse(state: MockState, activity: MockActivityRecord) {
  const user = getUserById(state, activity.userId);

  return {
    id: activity.id,
    action: activity.action,
    details: activity.details,
    createdAt: activity.createdAt,
    user: user
      ? {
          firstName: user.firstName,
          lastName: user.lastName,
          handle: user.handle,
          profileImageUrl: user.profileImageUrl,
        }
      : null,
  };
}

function toIssueResponse(state: MockState, issue: MockIssueRecord) {
  const author = getUserById(state, issue.authorId);

  return {
    id: issue.id,
    number: issue.number,
    title: issue.title,
    body: issue.body,
    state: issue.state,
    createdAt: issue.createdAt,
    author: author ? { handle: author.handle } : null,
  };
}

function toPullResponse(state: MockState, pull: MockPullRecord) {
  const author = getUserById(state, pull.authorId);

  return {
    id: pull.id,
    number: pull.number,
    title: pull.title,
    body: pull.body,
    state: pull.state,
    createdAt: pull.createdAt,
    author: author ? { handle: author.handle } : null,
    proposedSkillMd: pull.proposedSkillMd,
  };
}

function toTokenResponse(token: MockTokenRecord) {
  return {
    id: token.id,
    name: token.name,
    scopes: clone(token.scopes),
    lastUsedAt: token.lastUsedAt,
    expiresAt: token.expiresAt,
    createdAt: token.createdAt,
  };
}

function parseJsonBody(request: Request) {
  return request.clone().json().catch(() => ({}));
}

function jsonResponse(payload: unknown, status = 200, init?: ResponseInit) {
  return new Response(JSON.stringify(payload), {
    ...init,
    status,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });
}

function errorResponse(status: number, message: string) {
  return jsonResponse({ message }, status);
}

function findSkillById(state: MockState, skillId: string) {
  return state.skills.find((skill) => skill.id === skillId) ?? null;
}

function findSkillByOwnerAndSlug(state: MockState, ownerHandle: string, slug: string) {
  return (
    state.skills.find((skill) => {
      const owner = getUserById(state, skill.ownerId);
      return owner?.handle === ownerHandle && skill.slug === slug;
    }) ?? null
  );
}

function computeStats(state: MockState) {
  const versions = state.skills.reduce((total, skill) => total + skill.versions.length, 0);
  const downloads = state.skills.reduce((total, skill) => total + skill.downloads, 0);

  return {
    skills: state.skills.length,
    versions,
    downloads,
  };
}

function applySkillFilters(state: MockState, url: URL) {
  const search = (url.searchParams.get("search") || url.searchParams.get("q") || "").trim().toLowerCase();
  const tag = (url.searchParams.get("tag") || "").trim().toLowerCase();
  const sort = url.searchParams.get("sort") || "latest";
  const limit = Number.parseInt(url.searchParams.get("limit") || "0", 10) || 0;
  const offset = Number.parseInt(url.searchParams.get("offset") || "0", 10) || 0;

  let skills = state.skills.filter((skill) => !skill.isArchived);

  if (tag) {
    skills = skills.filter((skill) =>
      (skill.tags || []).some((candidate) => candidate.toLowerCase() === tag),
    );
  }

  if (search) {
    skills = skills.filter((skill) => {
      const owner = getUserById(state, skill.ownerId);
      const haystack = [
        skill.name,
        skill.slug,
        skill.description,
        ...(skill.tags || []),
        owner?.handle || "",
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(search);
    });
  }

  const sorted = skills.sort((left, right) => {
    if (sort === "stars") {
      return right.stars - left.stars;
    }
    if (sort === "downloads") {
      return right.downloads - left.downloads;
    }
    return new Date(latestVersion(right)?.publishedAt || right.updatedAt).getTime() - new Date(latestVersion(left)?.publishedAt || left.updatedAt).getTime();
  });

  const total = sorted.length;
  const sliced = limit > 0 ? sorted.slice(offset, offset + limit) : sorted;

  return {
    total,
    skills: sliced.map((skill) => toSkillSummary(state, skill)),
  };
}

function buildProfileResponse(state: MockState, user: MockUserRecord) {
  const ownedSkills = state.skills
    .filter((skill) => skill.ownerId === user.id)
    .sort((left, right) => right.stars - left.stars)
    .map((skill) => toSkillSummary(state, skill));

  return {
    ...toUserResponse(user),
    skills: ownedSkills,
  };
}

function getSkillFiles(skill: MockSkillRecord, versionName?: string | null) {
  const version = versionName
    ? skill.versions.find((candidate) => candidate.version === versionName)
    : latestVersion(skill);

  return version ?? null;
}

function buildValidationResult(skillMd: string) {
  const trimmed = skillMd.trim();
  const frontmatterMatch = trimmed.match(/^---\n[\s\S]*?\n---/);
  const hasName = /(?:^|\n)name:\s*.+/m.test(trimmed);
  const hasDescription = /(?:^|\n)description:\s*.+/m.test(trimmed);
  const hasOverview = /^##\s+Overview/m.test(trimmed) || /^#\s+/m.test(trimmed);
  const hasUsage = /Usage/i.test(trimmed);
  const hasPermissions = /Permissions|Safety/i.test(trimmed);

  const checks: MockValidationCheck[] = [
    {
      id: "frontmatter",
      category: "manifest",
      status: frontmatterMatch ? "passed" : "failed",
      message: frontmatterMatch ? "YAML frontmatter detected." : "Missing YAML frontmatter block.",
    },
    {
      id: "name",
      category: "manifest",
      status: hasName ? "passed" : "failed",
      message: hasName ? "Name field is present." : "Frontmatter needs a name field.",
    },
    {
      id: "description",
      category: "manifest",
      status: hasDescription ? "passed" : "failed",
      message: hasDescription ? "Description field is present." : "Frontmatter needs a description field.",
    },
    {
      id: "overview",
      category: "skillmd",
      status: hasOverview ? "passed" : "warning",
      message: hasOverview ? "Overview content is present." : "Add an overview section for faster operator onboarding.",
    },
    {
      id: "usage",
      category: "skillmd",
      status: hasUsage ? "passed" : "warning",
      message: hasUsage ? "Usage guidance is present." : "Consider adding usage examples or command snippets.",
    },
    {
      id: "safety",
      category: "security",
      status: hasPermissions ? "passed" : "warning",
      message: hasPermissions ? "Permissions and safety guidance detected." : "Document expected permissions and safety boundaries.",
    },
  ];

  const passedChecks = checks.filter((check) => check.status === "passed").length;
  const warningChecks = checks.filter((check) => check.status === "warning").length;
  const score = Math.round(((passedChecks + warningChecks * 0.5) / checks.length) * 100);

  return {
    passed: checks.every((check) => check.status !== "failed"),
    score,
    checks,
  };
}

function extractDependencyList(skillMd: string, field: "bins" | "env") {
  const match = skillMd.match(new RegExp(`${field}:\\s*\\n((?:\\s*-\\s*[^\\n]+\\n?)*)`, "m"));
  if (!match) return [];

  return match[1]
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.replace(/^-+\s*/, "").trim());
}

function buildDependencyReport(skillMd: string) {
  const installedBins = new Set(["bash", "curl", "git", "jq", "node"]);
  const configuredEnv = new Set(["OPENAI_API_KEY", "TRADING_API_KEY", "NEWS_API_KEY"]);

  const bins = extractDependencyList(skillMd, "bins").map((name) => ({
    name,
    type: "bin" as const,
    available: installedBins.has(name),
    version: installedBins.has(name) ? "1.0.0" : undefined,
  }));

  const env = extractDependencyList(skillMd, "env").map((name) => ({
    name,
    type: "env" as const,
    available: configuredEnv.has(name),
  }));

  const results = [...bins, ...env];

  return {
    allSatisfied: results.every((result) => result.available),
    results,
    summary: {
      total: results.length,
      satisfied: results.filter((result) => result.available).length,
      missing: results.filter((result) => !result.available).length,
    },
  };
}

function inferNameFromEmail(email: string) {
  const root = email.split("@")[0].replace(/\+/g, " ").replace(/[._-]/g, " ");
  const parts = root
    .split(" ")
    .map((part) => part.trim())
    .filter(Boolean);

  return {
    firstName: parts[0] ? parts[0][0].toUpperCase() + parts[0].slice(1) : "Preview",
    lastName: parts[1] ? parts[1][0].toUpperCase() + parts[1].slice(1) : "User",
    handle: root.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "preview-user",
  };
}

function createChatStreamResponse(skillName: string, message: string) {
  const responseText = [
    `Preview mode summary for ${skillName}: `,
    `the skill is tuned for operator-readable output and compact execution guidance. `,
    `For "${message}", start with the overview, inspect the dependency requirements, and then test the current version against your preferred trading workflow.`,
  ];

  const encoder = new TextEncoder();

  return new Response(
    new ReadableStream({
      start(controller) {
        responseText.forEach((chunk, index) => {
          window.setTimeout(() => {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: chunk })}\n\n`));
            if (index === responseText.length - 1) {
              controller.close();
            }
          }, index * 120);
        });
      },
    }),
    {
      status: 200,
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
      },
    },
  );
}

async function handleAuthRoutes(request: Request, url: URL, state: MockState) {
  if (url.pathname === "/api/auth/me" && request.method === "GET") {
    const user = getSessionUser(state);
    return user ? jsonResponse(toUserResponse(user)) : errorResponse(401, "Not signed in");
  }

  if (url.pathname === "/api/auth/login" && request.method === "POST") {
    const body = await parseJsonBody(request);
    const email = String(body.email || "").trim().toLowerCase();
    if (!email) return errorResponse(400, "Email is required");

    let user = state.users.find((candidate) => candidate.email.toLowerCase() === email) ?? null;

    if (!user) {
      const inferred = inferNameFromEmail(email);
      user = {
        id: nextId(state, "user"),
        email,
        handle: inferred.handle,
        firstName: inferred.firstName,
        lastName: inferred.lastName,
        bio: "Preview account generated for frontend-only mode.",
        profileImageUrl: null,
        hasOpenaiKey: email.includes("google") || email.includes("github"),
        isAdmin: false,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };
      state.users.push(user);
    }

    state.sessionUserId = user.id;
    return jsonResponse({ user: toUserResponse(user) });
  }

  if (url.pathname === "/api/auth/register" && request.method === "POST") {
    const body = await parseJsonBody(request);
    const email = String(body.email || "").trim().toLowerCase();
    const handle = String(body.handle || "").trim().toLowerCase();

    if (!email || !handle) {
      return errorResponse(400, "Email and handle are required");
    }

    if (state.users.some((user) => user.handle === handle && user.email !== email)) {
      return errorResponse(409, "Handle is already taken");
    }

    const user: MockUserRecord = {
      id: nextId(state, "user"),
      email,
      handle,
      firstName: String(body.firstName || "Preview").trim() || "Preview",
      lastName: String(body.lastName || "User").trim() || "User",
      bio: "New preview account created from the frontend-only auth flow.",
      profileImageUrl: null,
      hasOpenaiKey: false,
      isAdmin: false,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };

    state.users.push(user);
    state.sessionUserId = user.id;
    state.starsByUserId[user.id] = [];

    return jsonResponse({ user: toUserResponse(user) }, 201);
  }

  if (url.pathname === "/api/auth/logout" && request.method === "POST") {
    state.sessionUserId = null;
    return jsonResponse({ ok: true });
  }

  if (url.pathname === "/api/auth/forgot-password" && request.method === "POST") {
    return jsonResponse({ message: "Preview mode: password reset emails are simulated only." });
  }

  if (url.pathname === "/api/auth/reset-password" && request.method === "POST") {
    return jsonResponse({ message: "Preview mode: password reset accepted." });
  }

  if (url.pathname === "/api/auth/openai-key" && request.method === "PUT") {
    const user = getSessionUser(state);
    if (!user) return errorResponse(401, "Please sign in to update your API key");

    const body = await parseJsonBody(request);
    user.hasOpenaiKey = Boolean(body.apiKey);
    user.updatedAt = nowIso();

    return jsonResponse({ message: body.apiKey ? "API key saved" : "API key removed" });
  }

  return null;
}

async function handleSkillsRoutes(request: Request, url: URL, state: MockState) {
  if (url.pathname === "/api/stats" && request.method === "GET") {
    return jsonResponse(computeStats(state));
  }

  if (url.pathname === "/api/skills/trending" && request.method === "GET") {
    const limit = Number.parseInt(url.searchParams.get("limit") || "6", 10) || 6;
    const skills = state.skills
      .slice()
      .sort((left, right) => right.weeklyDownloads - left.weeklyDownloads)
      .slice(0, limit)
      .map((skill) => toSkillSummary(state, skill));

    return jsonResponse(skills);
  }

  if (url.pathname === "/api/skills" && request.method === "GET") {
    const results = applySkillFilters(state, url);

    if (url.searchParams.get("paginated") === "true") {
      return jsonResponse(results);
    }

    return jsonResponse(results.skills);
  }

  if (url.pathname === "/api/skills" && request.method === "POST") {
    const user = getSessionUser(state);
    if (!user) return errorResponse(401, "Please sign in to create a skill");

    const body = await parseJsonBody(request);
    const name = String(body.name || "").trim();
    const slug = String(body.slug || "").trim().toLowerCase();
    const description = String(body.description || "").trim();
    const tags = Array.isArray(body.tags) ? body.tags.map(String) : [];

    if (!name || !slug) {
      return errorResponse(400, "Name and slug are required");
    }

    if (findSkillByOwnerAndSlug(state, user.handle, slug)) {
      return errorResponse(409, "A skill with that slug already exists");
    }

    const skill: MockSkillRecord = {
      id: nextId(state, "skill"),
      name,
      slug,
      description: description || "New preview skill created from the frontend-only workspace.",
      isVerified: false,
      isArchived: false,
      license: "MIT",
      stars: 0,
      downloads: 0,
      weeklyDownloads: 0,
      forks: 0,
      tags,
      repository: null,
      homepage: null,
      ownerId: user.id,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      versions: [],
    };

    state.skills.unshift(skill);
    return jsonResponse(toSkillSummary(state, skill), 201);
  }

  const starStatusMatch = url.pathname.match(/^\/api\/skills\/([^/]+)\/starred$/);
  if (starStatusMatch && request.method === "GET") {
    const user = getSessionUser(state);
    if (!user) return jsonResponse({ starred: false });

    const starredIds = state.starsByUserId[user.id] || [];
    return jsonResponse({ starred: starredIds.includes(starStatusMatch[1]) });
  }

  const starToggleMatch = url.pathname.match(/^\/api\/skills\/([^/]+)\/star$/);
  if (starToggleMatch && request.method === "POST") {
    const user = getSessionUser(state);
    if (!user) return errorResponse(401, "Please sign in to star skills");

    const skill = findSkillById(state, starToggleMatch[1]);
    if (!skill) return errorResponse(404, "Skill not found");

    const starredIds = state.starsByUserId[user.id] || [];
    const alreadyStarred = starredIds.includes(skill.id);

    state.starsByUserId[user.id] = alreadyStarred
      ? starredIds.filter((id) => id !== skill.id)
      : [...starredIds, skill.id];

    skill.stars += alreadyStarred ? -1 : 1;
    skill.updatedAt = nowIso();
    state.activities.unshift({
      id: nextId(state, "activity"),
      skillId: skill.id,
      action: alreadyStarred ? "unstar" : "star",
      createdAt: nowIso(),
      userId: user.id,
    });

    return jsonResponse({ starred: !alreadyStarred, stars: skill.stars });
  }

  const activityMatch = url.pathname.match(/^\/api\/skills\/([^/]+)\/activity$/);
  if (activityMatch && request.method === "GET") {
    const activities = state.activities
      .filter((activity) => activity.skillId === activityMatch[1])
      .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
      .map((activity) => toActivityResponse(state, activity));

    return jsonResponse(activities);
  }

  const commentsMatch = url.pathname.match(/^\/api\/skills\/([^/]+)\/comments$/);
  if (commentsMatch && request.method === "GET") {
    const comments = state.comments
      .filter((comment) => comment.skillId === commentsMatch[1])
      .sort((left, right) => new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime())
      .map((comment) => toCommentResponse(state, comment));

    return jsonResponse(comments);
  }

  if (commentsMatch && request.method === "POST") {
    const user = getSessionUser(state);
    if (!user) return errorResponse(401, "Please sign in to comment");

    const body = await parseJsonBody(request);
    const content = String(body.content || "").trim();
    if (!content) return errorResponse(400, "Comment content is required");

    const comment: MockCommentRecord = {
      id: nextId(state, "comment"),
      skillId: commentsMatch[1],
      content,
      parentId: null,
      isEdited: false,
      createdAt: nowIso(),
      userId: user.id,
    };

    state.comments.push(comment);
    state.activities.unshift({
      id: nextId(state, "activity"),
      skillId: commentsMatch[1],
      action: "comment",
      createdAt: comment.createdAt,
      userId: user.id,
    });

    return jsonResponse(toCommentResponse(state, comment), 201);
  }

  const commentDeleteMatch = url.pathname.match(/^\/api\/comments\/([^/]+)$/);
  if (commentDeleteMatch && request.method === "DELETE") {
    const user = getSessionUser(state);
    if (!user) return errorResponse(401, "Please sign in to delete comments");

    const comment = state.comments.find((candidate) => candidate.id === commentDeleteMatch[1]);
    if (!comment) return errorResponse(404, "Comment not found");
    if (comment.userId !== user.id) return errorResponse(403, "You can only delete your own comments");

    state.comments = state.comments.filter((candidate) => candidate.id !== comment.id);
    return jsonResponse({ ok: true });
  }

  const issuesMatch = url.pathname.match(/^\/api\/skills\/([^/]+)\/issues$/);
  if (issuesMatch && request.method === "GET") {
    const issues = state.issues
      .filter((issue) => issue.skillId === issuesMatch[1])
      .sort((left, right) => right.number - left.number)
      .map((issue) => toIssueResponse(state, issue));

    return jsonResponse(issues);
  }

  if (issuesMatch && request.method === "POST") {
    const user = getSessionUser(state);
    if (!user) return errorResponse(401, "Please sign in to open issues");

    const body = await parseJsonBody(request);
    const title = String(body.title || "").trim();
    const issue: MockIssueRecord = {
      id: nextId(state, "issue"),
      skillId: issuesMatch[1],
      number: state.issues.filter((candidate) => candidate.skillId === issuesMatch[1]).length + 1,
      title: title || "Preview issue",
      body: String(body.body || "").trim(),
      state: "open",
      authorId: user.id,
      createdAt: nowIso(),
    };

    state.issues.unshift(issue);
    return jsonResponse(toIssueResponse(state, issue), 201);
  }

  const pullsMatch = url.pathname.match(/^\/api\/skills\/([^/]+)\/pulls$/);
  if (pullsMatch && request.method === "GET") {
    const pulls = state.pulls
      .filter((pull) => pull.skillId === pullsMatch[1])
      .sort((left, right) => right.number - left.number)
      .map((pull) => toPullResponse(state, pull));

    return jsonResponse(pulls);
  }

  if (pullsMatch && request.method === "POST") {
    const user = getSessionUser(state);
    if (!user) return errorResponse(401, "Please sign in to open pull requests");

    const body = await parseJsonBody(request);
    const title = String(body.title || "").trim();
    const proposedSkillMd = String(body.proposedSkillMd || "").trim();

    if (!title || !proposedSkillMd) {
      return errorResponse(400, "Title and proposed SKILL.md content are required");
    }

    const pull: MockPullRecord = {
      id: nextId(state, "pull"),
      skillId: pullsMatch[1],
      number: state.pulls.filter((candidate) => candidate.skillId === pullsMatch[1]).length + 1,
      title,
      body: String(body.body || "").trim(),
      state: "open",
      authorId: user.id,
      createdAt: nowIso(),
      proposedSkillMd,
    };

    state.pulls.unshift(pull);
    return jsonResponse(toPullResponse(state, pull), 201);
  }

  const forkMatch = url.pathname.match(/^\/api\/skills\/([^/]+)\/fork$/);
  if (forkMatch && request.method === "POST") {
    const user = getSessionUser(state);
    if (!user) return errorResponse(401, "Please sign in to fork skills");

    const source = findSkillById(state, forkMatch[1]);
    if (!source) return errorResponse(404, "Skill not found");

    const clonedVersions = clone(source.versions);
    const forkedSkill: MockSkillRecord = {
      ...clone(source),
      id: nextId(state, "skill"),
      slug: findSkillByOwnerAndSlug(state, user.handle, source.slug) ? `${source.slug}-fork` : source.slug,
      ownerId: user.id,
      stars: 0,
      downloads: 0,
      weeklyDownloads: 0,
      forks: 0,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      versions: clonedVersions.map((version, index) => ({
        ...version,
        id: nextId(state, "version"),
        isLatest: index === 0,
      })),
    };

    state.skills.unshift(forkedSkill);
    source.forks += 1;
    state.activities.unshift({
      id: nextId(state, "activity"),
      skillId: source.id,
      action: "fork",
      createdAt: nowIso(),
      userId: user.id,
    });

    return jsonResponse(toSkillSummary(state, forkedSkill), 201);
  }

  const versionsMatch = url.pathname.match(/^\/api\/skills\/([^/]+)\/versions$/);
  if (versionsMatch && request.method === "POST") {
    const user = getSessionUser(state);
    if (!user) return errorResponse(401, "Please sign in to publish versions");

    const skill = findSkillById(state, versionsMatch[1]);
    if (!skill) return errorResponse(404, "Skill not found");
    if (skill.ownerId !== user.id) return errorResponse(403, "Only the owner can publish versions");

    const body = await parseJsonBody(request);
    const versionName = String(body.version || "").trim();
    const skillMd = String(body.skillMd || "").trim();

    if (!versionName || !skillMd) {
      return errorResponse(400, "Version and SKILL.md content are required");
    }

    const validation = buildValidationResult(skillMd);
    const extraFiles = Array.isArray(body.files)
      ? body.files.map((file: { path?: string; content?: string }) => ({
          path: String(file.path || "").trim(),
          content: String(file.content || ""),
        }))
      : [];

    for (const version of skill.versions) {
      version.isLatest = false;
    }

    const newVersion: MockVersionRecord = {
      id: nextId(state, "version"),
      version: versionName,
      isLatest: true,
      isYanked: false,
      publishedAt: nowIso(),
      downloads: 0,
      changelog: String(body.changelog || "").trim(),
      skillMd,
      validations: [
        {
          id: nextId(state, "validation"),
          status: validation.passed ? "passed" : "failed",
          score: validation.score,
          checks: validation.checks,
        },
      ],
      files: [
        createFile("SKILL.md", skillMd, "text/markdown"),
        ...extraFiles.filter((file) => file.path).map((file) => createFile(file.path, file.content)),
      ],
    };

    skill.versions.unshift(newVersion);
    skill.updatedAt = nowIso();
    skill.downloads += 16;
    skill.weeklyDownloads += 16;

    state.activities.unshift({
      id: nextId(state, "activity"),
      skillId: skill.id,
      action: "publish",
      details: { version: versionName },
      createdAt: nowIso(),
      userId: user.id,
    });

    return jsonResponse(toVersionResponse(newVersion), 201);
  }

  const validateMatch = url.pathname.match(/^\/api\/skills\/([^/]+)\/validate$/);
  if (validateMatch && request.method === "POST") {
    const skill = findSkillById(state, validateMatch[1]);
    if (!skill) return errorResponse(404, "Skill not found");

    const validation = buildValidationResult(latestVersion(skill)?.skillMd || "");
    return jsonResponse(validation);
  }

  const deleteSkillMatch = url.pathname.match(/^\/api\/skills\/([^/]+)$/);
  if (deleteSkillMatch && request.method === "DELETE") {
    const user = getSessionUser(state);
    if (!user) return errorResponse(401, "Please sign in to delete skills");

    const skill = findSkillById(state, deleteSkillMatch[1]);
    if (!skill) return errorResponse(404, "Skill not found");
    if (skill.ownerId !== user.id) return errorResponse(403, "Only the owner can delete a skill");

    state.skills = state.skills.filter((candidate) => candidate.id !== skill.id);
    for (const userId of Object.keys(state.starsByUserId)) {
      state.starsByUserId[userId] = state.starsByUserId[userId].filter((id) => id !== skill.id);
    }
    return jsonResponse({ ok: true });
  }

  const fileContentMatch = url.pathname.match(/^\/api\/skills\/([^/]+)\/([^/]+)\/files\/(.+)$/);
  if (fileContentMatch && request.method === "GET") {
    const [, ownerHandle, slug, encodedPath] = fileContentMatch;
    const skill = findSkillByOwnerAndSlug(state, ownerHandle, slug);
    if (!skill) return errorResponse(404, "Skill not found");

    const version = getSkillFiles(skill, url.searchParams.get("version"));
    if (!version) return errorResponse(404, "Version not found");

    const filePath = decodeURIComponent(encodedPath);
    const file = version.files.find((candidate) => candidate.path === filePath);
    if (!file) return errorResponse(404, "File not found");

    return jsonResponse({
      path: file.path,
      content: file.content,
      size: file.size,
      isBinary: file.isBinary,
      mimeType: file.mimeType,
    });
  }

  const filesMatch = url.pathname.match(/^\/api\/skills\/([^/]+)\/([^/]+)\/files$/);
  if (filesMatch && request.method === "GET") {
    const [, ownerHandle, slug] = filesMatch;
    const skill = findSkillByOwnerAndSlug(state, ownerHandle, slug);
    if (!skill) return errorResponse(404, "Skill not found");

    const version = getSkillFiles(skill, url.searchParams.get("version"));
    if (!version) return errorResponse(404, "Version not found");

    return jsonResponse({
      files: version.files.map((file) => ({
        id: file.id,
        path: file.path,
        size: file.size,
        isBinary: file.isBinary,
        mimeType: file.mimeType,
        sha256: null,
        createdAt: file.createdAt,
      })),
      totalFiles: version.files.length,
      totalSize: version.files.reduce((total, file) => total + file.size, 0),
    });
  }

  const skillDetailMatch = url.pathname.match(/^\/api\/skills\/([^/]+)\/([^/]+)$/);
  if (skillDetailMatch && request.method === "GET") {
    const skill = findSkillByOwnerAndSlug(state, skillDetailMatch[1], skillDetailMatch[2]);
    return skill ? jsonResponse(toSkillDetail(state, skill)) : errorResponse(404, "Skill not found");
  }

  return null;
}

async function handleAccountRoutes(request: Request, url: URL, state: MockState) {
  if (url.pathname === "/api/my-skills" && request.method === "GET") {
    const user = getSessionUser(state);
    if (!user) return errorResponse(401, "Please sign in to view your skills");

    const skills = state.skills
      .filter((skill) => skill.ownerId === user.id)
      .map((skill) => toSkillSummary(state, skill));

    return jsonResponse(skills);
  }

  if (url.pathname === "/api/my-stars" && request.method === "GET") {
    const user = getSessionUser(state);
    if (!user) return errorResponse(401, "Please sign in to view your starred skills");

    const limit = Number.parseInt(url.searchParams.get("limit") || "0", 10) || 0;
    const starredSkills = (state.starsByUserId[user.id] || [])
      .map((skillId) => findSkillById(state, skillId))
      .filter((skill): skill is MockSkillRecord => Boolean(skill))
      .map((skill) => toSkillSummary(state, skill));

    return jsonResponse(limit > 0 ? starredSkills.slice(0, limit) : starredSkills);
  }

  const profileMatch = url.pathname.match(/^\/api\/users\/([^/]+)$/);
  if (profileMatch && request.method === "GET") {
    const user = state.users.find((candidate) => candidate.handle === profileMatch[1]);
    return user ? jsonResponse(buildProfileResponse(state, user)) : errorResponse(404, "User not found");
  }

  if (url.pathname === "/api/profile" && request.method === "PUT") {
    const user = getSessionUser(state);
    if (!user) return errorResponse(401, "Please sign in to update your profile");

    const body = await parseJsonBody(request);
    const nextHandle = String(body.handle || user.handle).trim().toLowerCase();
    const nextBio = String(body.bio || "").trim();
    const nextProfileImageUrl =
      typeof body.profileImageUrl === "string"
        ? body.profileImageUrl.trim() || null
        : body.profileImageUrl === null
          ? null
          : user.profileImageUrl;

    const handleTaken = state.users.some((candidate) => candidate.id !== user.id && candidate.handle === nextHandle);
    if (handleTaken) return errorResponse(409, "That handle is already in use");

    user.handle = nextHandle || user.handle;
    user.bio = nextBio;
    user.profileImageUrl = nextProfileImageUrl;
    user.updatedAt = nowIso();

    return jsonResponse(toUserResponse(user));
  }

  if (url.pathname === "/api/tokens" && request.method === "GET") {
    const user = getSessionUser(state);
    if (!user) return errorResponse(401, "Please sign in to view API tokens");

    const tokens = state.tokens.filter((token) => token.userId === user.id).map(toTokenResponse);
    return jsonResponse(tokens);
  }

  if (url.pathname === "/api/tokens" && request.method === "POST") {
    const user = getSessionUser(state);
    if (!user) return errorResponse(401, "Please sign in to create API tokens");

    const body = await parseJsonBody(request);
    const name = String(body.name || "").trim();
    if (!name) return errorResponse(400, "Token name is required");

    const token: MockTokenRecord = {
      id: nextId(state, "token"),
      userId: user.id,
      name,
      token: `shp_preview_${Math.random().toString(36).slice(2, 14)}`,
      scopes: ["read", "publish"],
      lastUsedAt: null,
      expiresAt: null,
      createdAt: nowIso(),
    };

    state.tokens.unshift(token);

    return jsonResponse(
      {
        ...toTokenResponse(token),
        token: token.token,
      },
      201,
    );
  }

  const tokenDeleteMatch = url.pathname.match(/^\/api\/tokens\/([^/]+)$/);
  if (tokenDeleteMatch && request.method === "DELETE") {
    const user = getSessionUser(state);
    if (!user) return errorResponse(401, "Please sign in to revoke API tokens");

    state.tokens = state.tokens.filter((token) => !(token.userId === user.id && token.id === tokenDeleteMatch[1]));
    return jsonResponse({ ok: true });
  }

  return null;
}

async function handleUtilityRoutes(request: Request, url: URL, state: MockState) {
  if (url.pathname === "/api/templates" && request.method === "GET") {
    return jsonResponse(
      skillTemplates.map(({ skillMd, ...template }) => template),
    );
  }

  const templateMatch = url.pathname.match(/^\/api\/templates\/([^/]+)$/);
  if (templateMatch && request.method === "GET") {
    const template = skillTemplates.find((candidate) => candidate.id === templateMatch[1]);
    return template ? jsonResponse(template) : errorResponse(404, "Template not found");
  }

  if (url.pathname === "/api/cli/validate" && request.method === "POST") {
    const body = await parseJsonBody(request);
    return jsonResponse(buildValidationResult(String(body.skillMd || "")));
  }

  if (url.pathname === "/api/check-dependencies" && request.method === "POST") {
    const body = await parseJsonBody(request);
    return jsonResponse(buildDependencyReport(String(body.skillMd || "")));
  }

  if (url.pathname === "/api/skills/explain" && request.method === "POST") {
    const user = getSessionUser(state);
    if (!user) return errorResponse(401, "Please sign in to use AI features");
    if (!user.hasOpenaiKey) return errorResponse(400, "OpenAI API key required in preview mode");

    const body = await parseJsonBody(request);
    const skillMd = String(body.skillMd || "");
    const nameMatch = skillMd.match(/(?:^|\n)name:\s*([^\n]+)/);
    const skillName = nameMatch?.[1]?.trim() || "preview skill";

    return jsonResponse({
      summary: `${skillName} is optimized for the Traderclaw workflow and turns raw context into a compact operator brief.`,
      capabilities: [
        "Summarizes the purpose and operating model of the skill",
        "Highlights what inputs and dependencies matter most",
        "Explains how to use the current version without backend services",
      ],
      useCases: ["Operator onboarding", "UI walkthroughs", "Preview validation"],
      requirements: extractDependencyList(skillMd, "bins").concat(extractDependencyList(skillMd, "env")),
      gettingStarted: "Open the SKILL.md panel, review the capabilities section, and test the current flow from the preview UI.",
    });
  }

  if (url.pathname === "/api/skills/generate" && request.method === "POST") {
    const user = getSessionUser(state);
    if (!user) return errorResponse(401, "Please sign in to generate skills");
    if (!user.hasOpenaiKey) return errorResponse(400, "OpenAI API key required in preview mode");

    const body = await parseJsonBody(request);
    const prompt = String(body.prompt || "Workflow assistant").trim();
    const category = String(body.category || "workflow").trim();
    const complexity = String(body.complexity || "moderate").trim();
    const name = prompt
      .split(/\s+/)
      .slice(0, 3)
      .map((part) => part[0]?.toUpperCase() + part.slice(1))
      .join(" ")
      .slice(0, 32) || "Preview Skill";
    const skillMd = createSkillMd(
      name,
      `Generated preview skill for ${prompt.toLowerCase()}.`,
      [category, complexity, "preview"],
      ["## Complexity\n- Generated in frontend-only preview mode"],
    );

    return jsonResponse({
      skillMd,
      name,
      description: `Generated ${complexity} ${category} workflow for ${prompt}.`,
      tags: [category, complexity, "preview"],
    });
  }

  if (url.pathname === "/api/skills/chat" && request.method === "POST") {
    const user = getSessionUser(state);
    if (!user) return errorResponse(401, "Please sign in to use AI features");
    if (!user.hasOpenaiKey) return errorResponse(400, "OpenAI API key required in preview mode");

    const body = await parseJsonBody(request);
    const skillMd = String(body.skillMd || "");
    const message = String(body.message || "");
    const nameMatch = skillMd.match(/(?:^|\n)name:\s*([^\n]+)/);
    const skillName = nameMatch?.[1]?.trim() || "preview skill";
    return createChatStreamResponse(skillName, message);
  }

  return null;
}

async function routeMockRequest(request: Request, url: URL) {
  const state = getState();

  const authResponse = await handleAuthRoutes(request, url, state);
  if (authResponse) return authResponse;

  const skillsResponse = await handleSkillsRoutes(request, url, state);
  if (skillsResponse) return skillsResponse;

  const accountResponse = await handleAccountRoutes(request, url, state);
  if (accountResponse) return accountResponse;

  const utilityResponse = await handleUtilityRoutes(request, url, state);
  if (utilityResponse) return utilityResponse;

  return errorResponse(404, `Preview route not mocked: ${request.method} ${url.pathname}`);
}

export function installFrontendOnlyMocks() {
  if (window.__SKILLHUB_FRONTEND_ONLY_INSTALLED__) {
    return;
  }

  const originalFetch = window.fetch.bind(window);
  window.__SKILLHUB_FRONTEND_ONLY_INSTALLED__ = true;
  window.__SKILLHUB_FRONTEND_ONLY_FETCH__ = originalFetch;

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const inputUrl = input instanceof Request ? input.url : String(input);
    const url = new URL(inputUrl, window.location.origin);

    if (!url.pathname.startsWith("/api/")) {
      return originalFetch(input, init);
    }

    const request = input instanceof Request ? new Request(input, init) : new Request(url.toString(), init);
    return routeMockRequest(request, url);
  };
}
