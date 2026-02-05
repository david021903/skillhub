import DocsLayout from "@/components/DocsLayout";

export default function SkillFormatExamples() {
  return (
    <DocsLayout
      title="SKILL.md Examples"
      description="Complete examples of well-written skills"
    >
      <h2>Example 1: Simple Skill</h2>
      <p>A minimal skill with no external dependencies:</p>
      <div className="not-prose bg-muted/50 border rounded-lg p-4 my-6">
        <pre className="bg-[hsl(222,47%,8%)] text-gray-100 rounded-lg p-4 text-sm overflow-x-auto">
{`---
name: code-reviewer
version: 1.0.0
description: Review code for best practices and potential issues
metadata:
  openclaw:
    requires:
      bins: []
      env: []
    permissions:
      - filesystem
---
# Code Reviewer

Review source code files for common issues, best practices, 
and potential bugs.

## Instructions

1. Read the file(s) the user wants reviewed
2. Analyze for:
   - Code style and consistency
   - Potential bugs or logic errors
   - Security vulnerabilities
   - Performance concerns
   - Missing error handling
3. Provide specific, actionable feedback with line references
4. Suggest improvements with code examples

## Output Format

For each issue found:
- **Location**: File and line number
- **Severity**: Critical / Warning / Suggestion
- **Description**: What the issue is
- **Fix**: How to resolve it`}
        </pre>
      </div>

      <h2>Example 2: Skill with Dependencies</h2>
      <p>A skill that requires external tools and environment variables:</p>
      <div className="not-prose bg-muted/50 border rounded-lg p-4 my-6">
        <pre className="bg-[hsl(222,47%,8%)] text-gray-100 rounded-lg p-4 text-sm overflow-x-auto">
{`---
name: api-tester
version: 2.1.0
description: Test REST APIs with automated request generation
metadata:
  openclaw:
    requires:
      bins:
        - curl
        - jq
      env:
        - API_BASE_URL
      skills: []
    permissions:
      - network
      - subprocess
---
# API Tester

Automatically test REST API endpoints by generating requests,
validating responses, and reporting results.

## Prerequisites

- \`curl\` must be installed for making HTTP requests
- \`jq\` must be installed for parsing JSON responses
- Set \`API_BASE_URL\` to the base URL of the API to test

## Instructions

1. Read the API specification or documentation provided
2. Generate test cases for each endpoint:
   - Valid requests with expected responses
   - Edge cases (empty inputs, large payloads)
   - Error cases (invalid auth, missing fields)
3. Execute requests using curl
4. Parse responses with jq
5. Report results in a summary table

## Example

\`\`\`bash
# Test a GET endpoint
curl -s "$API_BASE_URL/users" | jq '.[] | {id, name}'

# Test a POST endpoint
curl -s -X POST "$API_BASE_URL/users" \\
  -H "Content-Type: application/json" \\
  -d '{"name": "Test User"}' | jq '.'
\`\`\``}
        </pre>
      </div>

      <h2>Example 3: Multi-File Skill</h2>
      <p>
        A skill that includes helper scripts alongside the SKILL.md:
      </p>
      <div className="not-prose bg-muted/50 border rounded-lg p-4 my-6">
        <div className="mb-2 text-sm font-medium text-muted-foreground">File structure:</div>
        <pre className="bg-[hsl(222,47%,8%)] text-gray-100 rounded-lg p-4 text-sm overflow-x-auto">
{`my-skill/
├── SKILL.md           # Main skill file
├── scripts/
│   ├── setup.sh       # Setup script
│   └── analyze.py     # Analysis script
├── templates/
│   └── report.md      # Report template
└── .skillignore       # Files to exclude from publishing`}
        </pre>
      </div>
      <p>
        The SKILL.md can reference these files in its instructions, and they'll be 
        installed alongside the skill when users run <code>shsc install</code>.
      </p>

      <h2>Example 4: .skillignore</h2>
      <p>
        The <code>.skillignore</code> file works like <code>.gitignore</code> — it tells the CLI 
        which files to exclude when publishing:
      </p>
      <div className="not-prose bg-muted/50 border rounded-lg p-4 my-4">
        <pre className="bg-[hsl(222,47%,8%)] text-gray-100 rounded-lg p-4 text-sm overflow-x-auto">
{`# .skillignore
node_modules/
.env
*.log
.git/
tests/
README.md`}
        </pre>
      </div>
    </DocsLayout>
  );
}
