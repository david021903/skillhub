import DocsLayout from "@/components/DocsLayout";

export default function SkillFormatFrontmatter() {
  return (
    <DocsLayout
      title="YAML Frontmatter"
      description="Declaring your skill's metadata"
    >
      <p>
        The YAML frontmatter sits at the top of your SKILL.md file between two <code>---</code> lines. 
        It provides machine-readable metadata about your skill.
      </p>

      <h2>Complete Reference</h2>
      <div className="not-prose bg-muted/50 border rounded-lg p-4 my-6">
        <pre className="bg-[hsl(222,47%,8%)] text-gray-100 rounded-lg p-4 text-sm overflow-x-auto">
{`---
# Required fields
name: my-awesome-skill
version: 1.2.0
description: A clear, concise description of the skill

# Optional: OpenClaw metadata
metadata:
  openclaw:
    requires:
      # System binaries this skill needs
      bins:
        - python3
        - pip
        - curl

      # Environment variables required
      env:
        - OPENAI_API_KEY
        - DATABASE_URL

      # Other SkillHub skills this depends on
      skills:
        - skillhub/web-scraper
        - skillhub/json-parser

    # Permissions the skill needs
    permissions:
      - network        # Makes HTTP requests
      - filesystem      # Reads/writes files
      - subprocess      # Runs shell commands
---`}
        </pre>
      </div>

      <h2>Field Details</h2>

      <h3><code>name</code></h3>
      <p>
        The skill name. Use lowercase letters, numbers, and hyphens. This is the display name 
        used in search results and listings.
      </p>

      <h3><code>version</code></h3>
      <p>
        Follow <a href="https://semver.org" target="_blank" rel="noopener">Semantic Versioning</a> (SemVer):
      </p>
      <ul>
        <li><code>MAJOR.MINOR.PATCH</code> — e.g., <code>1.2.3</code></li>
        <li>Bump <strong>MAJOR</strong> for breaking changes</li>
        <li>Bump <strong>MINOR</strong> for new features (backward compatible)</li>
        <li>Bump <strong>PATCH</strong> for bug fixes</li>
      </ul>

      <h3><code>description</code></h3>
      <p>
        A one-line summary of what the skill does. Keep it under 200 characters. This appears 
        in search results and skill cards.
      </p>

      <h3><code>metadata.openclaw.requires.bins</code></h3>
      <p>
        List of system binaries (command-line tools) the skill needs to function. Users can 
        check if they have these installed using <code>shsc check deps</code>.
      </p>
      <div className="not-prose bg-muted/50 border rounded-lg p-4 my-4">
        <pre className="bg-[hsl(222,47%,8%)] text-gray-100 rounded-lg p-4 text-sm overflow-x-auto">
{`bins:
  - python3    # Python interpreter
  - node       # Node.js runtime
  - git        # Git version control
  - docker     # Docker container runtime`}
        </pre>
      </div>

      <h3><code>metadata.openclaw.requires.env</code></h3>
      <p>
        Environment variables the skill expects to be set. These are typically API keys or 
        configuration values.
      </p>

      <h3><code>metadata.openclaw.requires.skills</code></h3>
      <p>
        Other SkillHub skills this skill depends on, referenced as <code>owner/slug</code>. 
        The dependency checker can verify these are installed.
      </p>

      <h3><code>metadata.openclaw.permissions</code></h3>
      <p>
        Declare what permissions the skill uses. This improves your validation score and 
        helps users understand the skill's security profile:
      </p>
      <ul>
        <li><code>network</code> — Makes HTTP/network requests</li>
        <li><code>filesystem</code> — Reads or writes files</li>
        <li><code>subprocess</code> — Executes shell commands</li>
        <li><code>environment</code> — Reads environment variables</li>
      </ul>
    </DocsLayout>
  );
}
