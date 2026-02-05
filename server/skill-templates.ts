export interface SkillTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  tags: string[];
  skillMd: string;
}

export const skillTemplates: SkillTemplate[] = [
  {
    id: "blank",
    name: "Blank Skill",
    description: "Start from scratch with a minimal template",
    icon: "file",
    category: "Basic",
    tags: [],
    skillMd: `---
name: my-skill
description: A brief description of what this skill does
metadata:
  openclaw:
    requires:
      bins: []
      env: []
---

# My Skill

## Overview
One sentence summary of what the skill does.

## Capabilities
- Bullet list of capabilities

## Permissions & Safety
- Required permissions (filesystem/network/etc)
- Safety constraints

## Usage Examples
\`\`\`bash
# example usage
\`\`\`
`,
  },
  {
    id: "web-scraper",
    name: "Web Scraper",
    description: "Extract data from websites and web pages",
    icon: "globe",
    category: "Data",
    tags: ["web", "scraping", "data"],
    skillMd: `---
name: web-scraper
description: Scrape and extract structured data from web pages
metadata:
  openclaw:
    requires:
      bins:
        - curl
      env: []
---

# Web Scraper

## Overview
This skill enables extracting structured data from web pages using HTTP requests and HTML parsing.

## Capabilities
- Fetch web pages via HTTP/HTTPS
- Parse HTML and extract specific elements
- Handle pagination and multiple pages
- Export data in JSON/CSV format

## Permissions & Safety
- Requires network access to target domains
- Respects robots.txt directives
- Rate limits requests to avoid overloading servers

## Usage Examples
\`\`\`bash
scrape https://example.com/products --selector ".product-item"
\`\`\`
`,
  },
  {
    id: "api-integration",
    name: "API Integration",
    description: "Connect to external APIs and services",
    icon: "plug",
    category: "Integration",
    tags: ["api", "integration", "http"],
    skillMd: `---
name: api-integration
description: Connect and interact with external REST APIs
metadata:
  openclaw:
    requires:
      bins:
        - curl
      env:
        - API_KEY
---

# API Integration

## Overview
This skill provides integration with external REST APIs, handling authentication, requests, and response parsing.

## Capabilities
- Make authenticated API requests (GET, POST, PUT, DELETE)
- Handle OAuth and API key authentication
- Parse JSON/XML responses

## Permissions & Safety
- Requires network access to API endpoints
- API keys stored securely in environment variables
- Never logs sensitive authentication data

## Usage Examples
\`\`\`bash
api-call GET /users --param limit=10
\`\`\`
`,
  },
  {
    id: "cli-tool",
    name: "CLI Tool",
    description: "Command-line utility with arguments and flags",
    icon: "terminal",
    category: "Automation",
    tags: ["cli", "terminal", "automation"],
    skillMd: `---
name: cli-tool
description: A command-line tool for task automation
metadata:
  openclaw:
    requires:
      bins:
        - bash
      env: []
---

# CLI Tool

## Overview
A command-line utility that automates common tasks through a simple interface.

## Capabilities
- Parse command-line arguments and flags
- Execute shell commands safely
- Display formatted output

## Permissions & Safety
- Executes commands in a sandboxed environment
- Validates all user inputs
- Supports dry-run mode for testing

## Usage Examples
\`\`\`bash
cli-tool run --verbose
cli-tool run --dry-run
\`\`\`
`,
  },
  {
    id: "file-processor",
    name: "File Processor",
    description: "Transform and process files in bulk",
    icon: "folder",
    category: "Automation",
    tags: ["files", "processing", "batch"],
    skillMd: `---
name: file-processor
description: Process and transform files in bulk
metadata:
  openclaw:
    requires:
      bins: []
      env: []
---

# File Processor

## Overview
Batch process files with various transformation operations.

## Capabilities
- Rename files using patterns
- Convert between file formats
- Organize files into folders
- Extract metadata from files

## Permissions & Safety
- Requires read/write access to target directories
- Creates backups before destructive operations

## Usage Examples
\`\`\`bash
file-processor rename "*.jpg" --pattern "{date}_{name}.jpg"
\`\`\`
`,
  },
  {
    id: "data-analyzer",
    name: "Data Analyzer",
    description: "Analyze and visualize data from various sources",
    icon: "chart",
    category: "Data",
    tags: ["data", "analysis", "visualization"],
    skillMd: `---
name: data-analyzer
description: Analyze datasets and generate insights
metadata:
  openclaw:
    requires:
      bins: []
      env: []
---

# Data Analyzer

## Overview
Analyze structured data from CSV, JSON, or databases to generate statistics and insights.

## Capabilities
- Load data from CSV, JSON, Excel files
- Calculate statistics (mean, median, percentiles)
- Detect patterns and anomalies
- Generate summary reports

## Permissions & Safety
- Read-only access to data files
- No external network requests
- Processes data locally

## Usage Examples
\`\`\`bash
data-analyzer summary data.csv
data-analyzer stats data.csv --columns price,quantity
\`\`\`
`,
  },
  {
    id: "notification-sender",
    name: "Notification Sender",
    description: "Send notifications via email, SMS, or webhooks",
    icon: "bell",
    category: "Integration",
    tags: ["notifications", "email", "webhooks"],
    skillMd: `---
name: notification-sender
description: Send notifications through various channels
metadata:
  openclaw:
    requires:
      bins:
        - curl
      env:
        - SMTP_HOST
        - SMTP_USER
---

# Notification Sender

## Overview
Send notifications through multiple channels including email and webhooks.

## Capabilities
- Send emails via SMTP
- Post to webhooks (Slack, Discord, etc.)
- Template-based message formatting

## Permissions & Safety
- Requires network access for sending
- Credentials stored in environment variables
- Rate limiting to prevent spam

## Usage Examples
\`\`\`bash
notify email --to user@example.com --subject "Hello"
notify webhook https://hooks.slack.com/... --message "Alert!"
\`\`\`
`,
  },
  {
    id: "code-generator",
    name: "Code Generator",
    description: "Generate boilerplate code from templates",
    icon: "code",
    category: "Development",
    tags: ["code", "generator", "templates"],
    skillMd: `---
name: code-generator
description: Generate code scaffolding and boilerplate
metadata:
  openclaw:
    requires:
      bins: []
      env: []
---

# Code Generator

## Overview
Generate boilerplate code, project scaffolding, and common patterns from templates.

## Capabilities
- Generate project scaffolding
- Create component/module templates
- Generate CRUD operations

## Permissions & Safety
- Write access to project directories
- Validates output paths
- Never overwrites existing files without confirmation

## Usage Examples
\`\`\`bash
codegen component UserProfile --style module
codegen api users --methods get,post,put,delete
\`\`\`
`,
  },
];

export const templateCategories = [...new Set(skillTemplates.map(t => t.category))];

export function getTemplateById(id: string): SkillTemplate | undefined {
  return skillTemplates.find(t => t.id === id);
}
