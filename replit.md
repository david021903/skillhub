# SkillHub - OpenClaw Skills Registry

## Overview
SkillHub is a full-stack "GitHub for OpenClaw Skills" registry platform where developers can discover, publish, and install AI agent skills. The platform supports skill versioning, validation, search, user profiles, and one-command installation similar to npm/GitHub workflows.

**Domain**: skillhub.space

## Tech Stack
- **Backend**: Node.js + Express.js + TypeScript
- **Frontend**: React 18 + Vite + TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Custom email/password + Google OAuth (session-based)
- **UI**: Tailwind CSS + shadcn/ui components
- **Routing**: Wouter (lightweight React router)

## Project Structure
```
/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   │   └── ui/         # shadcn/ui components
│   │   ├── pages/          # Page components
│   │   ├── hooks/          # Custom React hooks
│   │   └── lib/            # Utility functions
│   └── index.html
├── server/                 # Express backend
│   ├── index.ts            # Server entry point
│   ├── routes.ts           # API routes
│   ├── auth.ts             # Authentication (email/password, Google OAuth)
│   ├── db.ts               # Database connection
│   ├── ai-features.ts      # AI features (BYOK OpenAI)
│   └── validation.ts       # Skill validation pipeline
├── shared/                 # Shared types/schemas
│   ├── schema.ts           # Export all schemas
│   └── models/
│       ├── auth.ts         # User/session schemas
│       └── skills.ts       # Skill-related schemas
├── drizzle.config.ts       # Database config
├── vite.config.ts          # Vite configuration
└── tailwind.config.js      # Tailwind configuration
```

## Database Schema
- **users**: User accounts with email/password or OAuth
- **auth_identities**: Multi-provider auth (email, google)
- **password_reset_tokens**: Password reset tokens
- **email_verification_tokens**: Email verification
- **sessions**: Session storage (PostgreSQL-backed via connect-pg-simple)
- **skills**: Published skills with metadata
- **skill_versions**: Versioned releases of skills
- **skill_validations**: Validation results for each version
- **skill_stars**: User stars/favorites

## Key Features
1. **Browse & Discover**: Search and filter skills by name, tags, or popularity
2. **Publish Skills**: Create skills with SKILL.md format and YAML frontmatter
3. **Version Control**: Semantic versioning with version history
4. **Validation Pipeline**: Automatic security checks and best practice validation
5. **User Profiles**: Public profiles with skill showcase
6. **Star System**: Star/favorite skills you like
7. **CLI Tool (shsc)**: Command-line interface for developers
8. **API Tokens**: Scope-based tokens for CLI authentication

## API Endpoints
### Web API
- `GET /api/skills` - List all public skills
- `GET /api/skills/:owner/:slug` - Get skill details
- `POST /api/skills` - Create new skill (auth required)
- `POST /api/skills/:id/versions` - Publish new version
- `POST /api/skills/:id/star` - Toggle star
- `GET /api/my-skills` - Get user's skills
- `GET /api/users/:handle` - Get user profile
- `PUT /api/profile` - Update own profile

### CLI API (Bearer token auth, scope enforcement)
- `GET /api/cli/whoami` - Get authenticated user info (read scope)
- `POST /api/cli/skills` - Create new skill (write scope)
- `POST /api/cli/skills/:owner/:slug/publish` - Publish version (write scope)
- `GET /api/cli/skills/:owner/:slug/install` - Download skill for install (read scope)
- `GET /api/cli/search` - Search skills (read scope)
- `POST /api/cli/validate` - Validate SKILL.md (read scope)

### Token Management
- `GET /api/tokens` - List user's tokens
- `POST /api/tokens` - Create new token
- `DELETE /api/tokens/:id` - Revoke token

### Templates API
- `GET /api/templates` - List all starter templates
- `GET /api/templates/:id` - Get template details with full SKILL.md content

### Dependency Checker API
- `POST /api/check-dependencies` - Check skill dependencies (bins, env, skills)
- `POST /api/cli/check-dependencies` - CLI endpoint for dependency checking (requires read scope)

### AI-Powered Features API
- `POST /api/skills/explain` - AI skill explainer (returns summary, capabilities, use cases)
- `POST /api/skills/generate` - AI skill generator (auth required, returns generated SKILL.md)
- `POST /api/skills/chat` - AI skill chat (streaming SSE)

## Running the Project
- Development: `npm run dev` (runs on port 5000)
- Database push: `npm run db:push`
- Build: `npm run build`

## OpenClaw SKILL.md Format
Skills use markdown with YAML frontmatter:
```yaml
---
name: skill-name
description: Brief description
metadata:
  openclaw:
    requires:
      bins: []
      env: []
---
# Skill Name
...content...
```

## CLI Tool (shsc)
The CLI provides a GitHub-like experience for skill management:
```bash
# Authentication
shsc auth login              # Login with API token
shsc auth logout             # Logout and clear credentials
shsc auth whoami             # Show current user

# Skill Management
shsc init                    # Initialize new skill in current directory
shsc publish                 # Publish skill to registry
shsc install owner/skill     # Install skill to .local/skills

# Discovery
shsc search <query>          # Search for skills
shsc browse                  # Interactive skill browser
shsc validate                # Validate SKILL.md before publishing
```

## SEO
- `server/seo.ts`: SEO routes and dynamic meta tag injection
- `/robots.txt`: Crawl directives for search engines
- `/sitemap.xml`: Dynamic sitemap with all 1000+ public skill URLs
- Production catch-all injects per-skill meta tags (title, description, OG, Twitter, JSON-LD)
- JSON-LD structured data: WebSite schema on homepage, SoftwareApplication on skill pages
- XSS-safe: HTML entities escaped in meta attrs, `</script>` escaped in JSON-LD

## Recent Changes
- 2026-02-05: Rebranded from ClawSkillHub to SkillHub
  - Domain changed from clawskillhub.com to skillhub.space
  - CLI renamed from clawskillhub/csh to shsc (SkillHub Space CLI)
  - npm package renamed from clawskillhub-cli to shsc
  - Updated all frontend, backend, and documentation references
  - System user renamed from clawskillhub to skillhub
  - Now at 1,006+ validated skills in the registry
- 2026-02-05: Custom authentication system (replacing Replit OAuth)
  - Email/password registration and login with bcrypt hashing
  - Google OAuth integration with account linking
  - Session-based auth with PostgreSQL store (connect-pg-simple)
  - Password reset flow with secure tokens
  - Multi-provider auth via auth_identities table
  - Bring-your-own-key (BYOK) AI features - users provide their own OpenAI API key
  - AuthForms component with tabbed login/register UI
  - Updated SettingsAI page to manage OpenAI API key
  - Database: auth_identities, password_reset_tokens, email_verification_tokens tables
  - Added passwordHash, emailVerified, openaiApiKey fields to users table
- 2026-02-05: GitHub-like Issues, Pull Requests, and Fork functionality
  - Issues system: Create, view, comment on issues per skill with numbered IDs
  - Pull Requests: Propose SKILL.md changes, merge by owner with version bump
  - Fork: Copy skills to your account (fork counter, forkedFromId tracking)
  - SkillTabs: Code/Issues/Pull Requests tabbed navigation
  - Version selector: View/download any version of a skill
  - Database: skill_issues, skill_pull_requests, issue_comments, pr_comments tables
- 2026-02-05: Added private/public skill visibility toggle and comments system
  - CreateSkill form now has GitHub-like visibility selector (Public/Private)
  - Comments system: skill_comments table, API endpoints (GET, POST, DELETE)
  - SkillComments component on skill detail pages with create/delete functionality
- 2026-02-05: Comprehensive QA and bug fixes
  - Fixed nested link issue in SettingsLayout (invalid DOM nesting)
  - Fixed Profile page to use correct /api/my-stars endpoint
  - Fixed CLI build errors (templates.ts api import, validate.ts undefined check)
  - Updated tsconfig moduleResolution to 'bundler' for CLI
  - Updated SettingsAI page to show AI features as Active with quick access links
  - Added /users/:handle route for GitHub-like profile URLs
  - Profile page now has Overview/Skills/Stars tabs
  - User dropdown links now go to public profile instead of edit page
- 2026-02-05: AI-Powered Features (Tasks 7-10)
  - Skill Explainer: AI generates plain-English explanation of skills
  - Skill Generator: Create SKILL.md from natural language prompts
  - Skill Chat: Ask questions about skills with streaming responses
  - Integration: SkillExplainer and SkillChat on SkillDetail page
  - Rate limiting: 30 requests/hour on AI endpoints to prevent abuse
  - UI: AI Generator link in sidebar, /generate page
  - Uses Replit AI Integrations (gpt-5.1, billed to Replit credits)
- 2026-02-05: GitHub-like platform improvements
  - Health badges: Validation status, version, stars, downloads, license display
  - Dependency graph: Visual display of required skills, bins, and env vars
  - Activity feed: Recent activity (star, publish, install) on skill pages
  - Trending section: Algorithm-based trending skills (weekly downloads + stars)
  - Rate limiting: API protection (100 req/15min general, 10/hr auth, 20/hr publish)
  - Database: Added license, repository, dependencies, weeklyDownloads, forks, activities table
  - UI: SkillBadges, DependencyGraph, ActivityFeed, ValidationScore components
  - API: Extended skill detail endpoint with validation data and new fields
- 2026-02-05: CLI tool and API tokens with scope enforcement
  - CLI: shsc CLI with auth, publish, install, search, validate commands
  - API: Token-based authentication with scope enforcement (read/write)
  - Settings: API token management UI (create, list, revoke)
  - UI: User dropdown menu with Settings, API Tokens, Profile links
  - Security: Token scope enforcement on CLI publish endpoints
- 2026-02-05: Added comprehensive error handling, loading skeletons, input validation
  - Frontend: Error states with retry buttons on Browse, Home, MySkills, SkillDetail pages
  - Frontend: Skeleton loading animations for better UX
  - Backend: Input validation for skill creation (name, slug format, description length)
  - Backend: Input validation for profile updates (handle format, bio length)
- 2026-02-05: Imported 1000+ skills under "skillhub" official account
  - Created import script for batch skill importing with duplicate detection
  - Update script downloads real SKILL.md content from source
  - System user: skillhub (official account for curated skills)
- 2026-02-05: Multi-file skill support with file browser and ZIP downloads
  - Database: skill_files table for storing multiple files per skill version
  - FileBrowser: GitHub-like tree view with file content viewer
  - FileUploader: Drag-and-drop multi-file upload in skill creation
  - ZIP upload: Upload ZIP archives that auto-extract to files
  - ZIP download: Download entire skill as ZIP archive with all files
  - CLI: Updated publish to collect all text files, install to extract files
  - .skillignore: Pattern-based file exclusion for CLI publish
  - Security: Path traversal protection on file upload and install
  - UI components: FileBrowser, FileUploader integrated in SkillTabs and CreateSkill
- 2026-02-05: Added "Browse Skills" navigation link to landing page and header
  - Landing page: Browse Skills text link next to logo in nav bar
  - Header: Browse Skills text label on search button (text on desktop, icon-only on mobile)
- 2025-02-05: Initial project setup with full CRUD for skills, versioning, validation, and user profiles

## Admin CRM Dashboard (Implemented: Phase 1 & 2)
A private admin dashboard for monitoring and moderating platform activity.

### Phase 1 — Activity Feed Dashboard (Done)
- Protected `/admin` route (admin-only access, server + client guard)
- Real-time activity feed: new comments, skills, users, stars, issues, PRs
- Direct links to relevant skill/user/comment for quick action
- Filters by event type (comments, new skills, signups, etc.)
- Summary stats: today's signups, new skills this week, active users, comments
- Auto-refresh every 30 seconds

### Phase 2 — Moderation Tools (Done)
- Delete/hide comments directly from dashboard (single + bulk)
- Flag/remove skills: archive, make private/public, delete
- Quick user overview dialog: see user's skills, comments, stats at a glance
- Bulk actions: checkbox select + bulk delete for comments
- Delete issue comments and PR comments from admin API
- Admin link in user dropdown (only shown to admin users)

### Phase 3 — Notifications & Alerts
- Optional email or in-app notifications for new comments
- Daily digest email summarizing platform activity
- Alerts for unusual activity (spam patterns, rapid signups)

### Phase 4 — Analytics (nice-to-have)
- Growth trend charts (skills published, downloads, signups over time)
- Most active users and most commented skills
- Search query analytics (what people are looking for)
