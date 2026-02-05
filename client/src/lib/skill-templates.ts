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
- Does not store cookies or session data

## Usage Examples
\`\`\`bash
# Scrape product listings from a page
scrape https://example.com/products --selector ".product-item"

# Extract all links from a page
scrape https://example.com --extract links
\`\`\`

## Output Format
Returns structured JSON with extracted data:
\`\`\`json
{
  "url": "https://example.com",
  "items": [...]
}
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
- Retry failed requests with exponential backoff

## Permissions & Safety
- Requires network access to API endpoints
- API keys stored securely in environment variables
- Never logs sensitive authentication data
- Validates responses before returning

## Configuration
Set the following environment variables:
- \`API_KEY\`: Your API authentication key
- \`API_BASE_URL\`: Base URL for the API (optional)

## Usage Examples
\`\`\`bash
# Fetch data from an API
api-call GET /users --param limit=10

# Create a new resource
api-call POST /items --data '{"name": "New Item"}'
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
- Display formatted output (tables, JSON, progress bars)
- Support for configuration files

## Permissions & Safety
- Executes commands in a sandboxed environment
- Validates all user inputs
- Logs all executed commands for auditing
- Supports dry-run mode for testing

## Command Reference

### Basic Usage
\`\`\`bash
cli-tool <command> [options]
\`\`\`

### Commands
- \`run\` - Execute the main task
- \`config\` - Manage configuration
- \`status\` - Show current status

### Global Options
- \`--verbose, -v\` - Enable verbose output
- \`--dry-run\` - Preview without executing
- \`--config <file>\` - Use custom config file

## Usage Examples
\`\`\`bash
# Run with verbose output
cli-tool run --verbose

# Preview changes without executing
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
Batch process files with various transformation operations like renaming, converting, and organizing.

## Capabilities
- Rename files using patterns
- Convert between file formats
- Organize files into folders
- Extract metadata from files
- Compress and archive files

## Permissions & Safety
- Requires read/write access to target directories
- Creates backups before destructive operations
- Validates file paths to prevent directory traversal
- Supports undo for recent operations

## Usage Examples
\`\`\`bash
# Rename files with pattern
file-processor rename "*.jpg" --pattern "{date}_{name}.jpg"

# Convert images to webp
file-processor convert images/*.png --to webp

# Organize by date
file-processor organize ~/Downloads --by date
\`\`\`

## Supported Formats
- Images: jpg, png, gif, webp, svg
- Documents: pdf, docx, txt, md
- Archives: zip, tar, gz
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
Analyze structured data from CSV, JSON, or databases to generate statistics, insights, and visualizations.

## Capabilities
- Load data from CSV, JSON, Excel files
- Calculate statistics (mean, median, percentiles)
- Detect patterns and anomalies
- Generate summary reports
- Export results in various formats

## Permissions & Safety
- Read-only access to data files
- No external network requests
- Processes data locally
- Anonymizes sensitive fields when requested

## Usage Examples
\`\`\`bash
# Analyze a CSV file
data-analyzer summary data.csv

# Get statistics for specific columns
data-analyzer stats data.csv --columns price,quantity

# Find anomalies
data-analyzer anomalies data.csv --threshold 2.5
\`\`\`

## Output Format
\`\`\`json
{
  "rows": 1000,
  "columns": ["id", "name", "value"],
  "statistics": {
    "value": {"min": 0, "max": 100, "mean": 50.5}
  }
}
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
        - SMTP_PASS
---

# Notification Sender

## Overview
Send notifications through multiple channels including email, webhooks, and push notifications.

## Capabilities
- Send emails via SMTP
- Post to webhooks (Slack, Discord, etc.)
- Template-based message formatting
- Scheduled notifications
- Delivery confirmation tracking

## Permissions & Safety
- Requires network access for sending
- Credentials stored in environment variables
- Rate limiting to prevent spam
- Logs all sent notifications

## Configuration
Required environment variables:
- \`SMTP_HOST\`: SMTP server address
- \`SMTP_USER\`: SMTP username
- \`SMTP_PASS\`: SMTP password

## Usage Examples
\`\`\`bash
# Send an email
notify email --to user@example.com --subject "Hello" --body "Message"

# Post to Slack webhook
notify webhook https://hooks.slack.com/... --message "Alert!"

# Send from template
notify email --to user@example.com --template welcome
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
- Apply code patterns and best practices
- Support multiple languages and frameworks

## Permissions & Safety
- Write access to project directories
- Validates output paths
- Never overwrites existing files without confirmation
- Generates safe, sanitized code

## Supported Templates
- React components
- API endpoints
- Database models
- Test files
- Configuration files

## Usage Examples
\`\`\`bash
# Generate a React component
codegen component UserProfile --style module

# Scaffold a REST API endpoint
codegen api users --methods get,post,put,delete

# Create database model
codegen model User --fields "name:string,email:string,age:int"
\`\`\`
`,
  },
];

export const templateCategories = [...new Set(skillTemplates.map(t => t.category))];

export function getTemplateById(id: string): SkillTemplate | undefined {
  return skillTemplates.find(t => t.id === id);
}

export function getTemplatesByCategory(category: string): SkillTemplate[] {
  return skillTemplates.filter(t => t.category === category);
}
