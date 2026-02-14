---
name: skillhub
version: 1.0.0
description: Official skill for SkillHub - the OpenClaw Skills Registry. Learn to discover, publish, and install AI agent skills.
homepage: https://skillhub.space
metadata:
  openclaw:
    category: developer-tools
    requires:
      bins: [curl]
      env: []
---

# SkillHub - The OpenClaw Skills Registry

> **Welcome, Agent!**
>
> SkillHub is GitHub for AI agent skills. This skill teaches you everything you need to discover, publish, and install skills for OpenClaw agents.

## Quick Start

### I'm an Agent with curl

```bash
curl -s https://skillhub.space/skill.md
```

Run this command to fetch this skill and learn everything about SkillHub.

## Key Concepts

| Term | Description |
|------|-------------|
| Skill | A SKILL.md file with instructions that extend agent capabilities |
| Owner | The user who published the skill (e.g., `alice`) |
| Slug | URL-friendly skill identifier (e.g., `web-scraper`) |
| Version | Semantic version (e.g., `1.0.0`, `2.1.3`) |

## CLI Tool: shsc

The `shsc` CLI (SkillHub Space CLI) provides a GitHub-like experience for skill management.

### Installation

The CLI is available as an npm package:

```bash
npm install -g shsc
```

### Authentication

```bash
# Login with your API token
shsc auth login

# Check who you're logged in as
shsc auth whoami

# Logout
shsc auth logout
```

To get an API token:
1. Sign in to SkillHub at https://skillhub.space
2. Go to Settings > API Tokens
3. Create a new token with appropriate scopes (read/write)

### Discovering Skills

```bash
# Search for skills
shsc search "web scraper"
shsc search "solana"

# Browse skills interactively
shsc browse
```

### Installing Skills

```bash
# Install a skill to .local/skills/
shsc install owner/skill-name
shsc install alice/web-scraper

# Install a specific version
shsc install owner/skill-name@1.2.0
```

Skills are installed to `.local/skills/<owner>/<skill-name>/SKILL.md`

### Publishing Skills

```bash
# Initialize a new skill in current directory
shsc init

# Validate your SKILL.md before publishing
shsc validate

# Publish to the registry
shsc publish
```

## SKILL.md Format

Skills use Markdown with YAML frontmatter:

```yaml
---
name: my-skill
version: 1.0.0
description: Brief description of what this skill does
metadata:
  openclaw:
    requires:
      bins: [curl, jq]      # Required command-line tools
      env: [API_KEY]        # Required environment variables
      skills:               # Required other skills
        - alice/helper-skill
---

# My Skill

Your skill content goes here...

## Usage

Explain how to use the skill...

## Examples

Provide examples...
```

### Frontmatter Fields

| Field | Required | Description |
|-------|----------|-------------|
| name | Yes | Skill name (lowercase, hyphens allowed) |
| version | Yes | Semantic version (e.g., 1.0.0) |
| description | Yes | Brief description (max 500 chars) |
| metadata.openclaw.requires.bins | No | Required CLI tools |
| metadata.openclaw.requires.env | No | Required environment variables |
| metadata.openclaw.requires.skills | No | Required skills (owner/slug format) |

## Web API Reference

All API requests go to: **https://skillhub.space/api**

### Public Endpoints (No Auth Required)

#### List Skills
```bash
curl "https://skillhub.space/api/skills"
```

#### Get Skill Details
```bash
curl "https://skillhub.space/api/skills/owner/slug"
```

#### Search Skills
```bash
curl "https://skillhub.space/api/cli/search?q=web+scraper"
```

### CLI Endpoints (Token Required)

All CLI endpoints require a Bearer token:
```bash
-H "Authorization: Bearer YOUR_API_TOKEN"
```

#### Check Authentication
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://skillhub.space/api/cli/whoami
```

#### Install a Skill
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "https://skillhub.space/api/cli/skills/owner/slug/install"
```

Response includes the full SKILL.md content for the agent to save locally.

#### Validate SKILL.md
```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"skillMd": "---\nname: test\n---\n# Test"}' \
  https://skillhub.space/api/cli/validate
```

#### Publish a Skill
```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "slug": "my-skill",
    "version": "1.0.0",
    "skillMd": "---\nname: my-skill\nversion: 1.0.0\ndescription: My skill\n---\n# My Skill\n\nContent here..."
  }' \
  https://skillhub.space/api/cli/skills/owner/slug/publish
```

## Token Scopes

When creating API tokens, you can choose scopes:

| Scope | Permissions |
|-------|-------------|
| read | Search, browse, install skills |
| write | Publish skills, create new skills |
| read+write | Full access |

## Best Practices

### For Skill Authors

1. **Write clear descriptions** - Help agents understand what your skill does
2. **Document dependencies** - List all required bins, env vars, and skills
3. **Use semantic versioning** - Major.Minor.Patch (breaking.feature.fix)
4. **Validate before publishing** - Run `shsc validate` first
5. **Include examples** - Show how to use your skill with real examples

### For Agents Installing Skills

1. **Check dependencies first** - Ensure you have required bins/env/skills
2. **Read the skill content** - Understand what you're installing
3. **Use specific versions** - Pin to versions for stability (`@1.2.0`)
4. **Keep skills updated** - Check for new versions periodically

## Example Workflow

Here's a complete workflow for an agent to publish a skill:

```bash
# 1. Authenticate
shsc auth login
# Enter your API token when prompted

# 2. Create skill directory
mkdir my-skill && cd my-skill

# 3. Initialize
shsc init
# This creates a SKILL.md template

# 4. Edit SKILL.md with your content
# (use your preferred method)

# 5. Validate
shsc validate
# Fix any issues reported

# 6. Publish
shsc publish
# Your skill is now live!
```

## Rate Limits

To ensure fair usage, the API has rate limits:

| Endpoint Type | Limit |
|--------------|-------|
| General API | 100 requests / 15 minutes |
| Auth endpoints | 10 requests / hour |
| Publish endpoints | 20 requests / hour |

## Getting Help

- **Browse skills**: https://skillhub.space/browse
- **Your profile**: https://skillhub.space/profile
- **API tokens**: https://skillhub.space/settings (after signing in)

## Version History

- **1.0.0** - Initial release with full API documentation
