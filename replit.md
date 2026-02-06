# SkillBook - OpenClaw Skills Registry

## Overview
SkillBook is a full-stack "GitHub for OpenClaw Skills" registry platform where developers can discover, publish, and install AI agent skills. The platform supports skill versioning, validation, search, user profiles, and one-command installation similar to npm/GitHub workflows.

## Tech Stack
- **Backend**: Node.js + Express.js + TypeScript
- **Frontend**: React 18 + Vite + TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Replit OAuth (OpenID Connect)
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
│   ├── db.ts               # Database connection
│   ├── validation.ts       # Skill validation pipeline
│   └── replit_integrations/
│       └── auth/           # Replit Auth integration
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
- **users**: User accounts (synced from Replit OAuth)
- **sessions**: Session storage for authentication
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
7. **CLI Tool (skillbook/sb)**: Command-line interface for developers
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

## CLI Tool (skillbook)
The CLI provides a GitHub-like experience for skill management:
```bash
# Authentication
skillbook auth login              # Login with API token
skillbook auth logout             # Logout and clear credentials
skillbook auth whoami             # Show current user

# Skill Management
skillbook init                    # Initialize new skill in current directory
skillbook publish                 # Publish skill to registry
skillbook install owner/skill     # Install skill to .local/skills

# Discovery
skillbook search <query>          # Search for skills
skillbook browse                  # Interactive skill browser
skillbook validate                # Validate SKILL.md before publishing
```

Short alias `sb` available: `sb install owner/skill`

## Recent Changes
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
  - CLI: skillbook/sb CLI with auth, publish, install, search, validate commands
  - API: Token-based authentication with scope enforcement (read/write)
  - Settings: API token management UI (create, list, revoke)
  - UI: User dropdown menu with Settings, API Tokens, Profile links
  - Security: Token scope enforcement on CLI publish endpoints
- 2026-02-05: Added comprehensive error handling, loading skeletons, input validation
  - Frontend: Error states with retry buttons on Browse, Home, MySkills, SkillDetail pages
  - Frontend: Skeleton loading animations for better UX
  - Backend: Input validation for skill creation (name, slug format, description length)
  - Backend: Input validation for profile updates (handle format, bio length)
- 2025-02-05: Initial project setup with full CRUD for skills, versioning, validation, and user profiles
