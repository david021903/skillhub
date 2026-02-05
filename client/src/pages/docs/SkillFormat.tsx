import DocsLayout from "@/components/DocsLayout";

export default function SkillFormat() {
  return (
    <DocsLayout
      title="SKILL.md Format"
      description="The standard format for OpenClaw skills"
    >
      <p>
        Every skill on SkillHub is defined by a <code>SKILL.md</code> file. This is a Markdown 
        file with YAML frontmatter that describes the skill's metadata, requirements, and instructions.
      </p>

      <h2>Structure Overview</h2>
      <p>A SKILL.md file has two parts:</p>
      <ol>
        <li><strong>YAML Frontmatter</strong> — Metadata between <code>---</code> delimiters at the top</li>
        <li><strong>Markdown Body</strong> — The actual skill instructions and documentation</li>
      </ol>

      <div className="not-prose bg-muted/50 border rounded-lg p-4 my-6">
        <pre className="bg-[hsl(222,47%,8%)] text-gray-100 rounded-lg p-4 text-sm overflow-x-auto">
{`---
name: my-skill
version: 1.0.0
description: What this skill does in one sentence
metadata:
  openclaw:
    requires:
      bins: [python3, pip]
      env: [API_KEY]
      skills: [skillhub/web-scraper]
---
# My Skill

Instructions for the agent go here...`}
        </pre>
      </div>

      <h2>Required Fields</h2>
      <table>
        <thead>
          <tr>
            <th>Field</th>
            <th>Type</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>name</code></td>
            <td>string</td>
            <td>The skill name (lowercase, hyphens allowed)</td>
          </tr>
          <tr>
            <td><code>version</code></td>
            <td>string</td>
            <td>Semantic version (e.g., <code>1.0.0</code>)</td>
          </tr>
          <tr>
            <td><code>description</code></td>
            <td>string</td>
            <td>Brief description of the skill's purpose</td>
          </tr>
        </tbody>
      </table>

      <h2>Optional Metadata</h2>
      <p>
        The <code>metadata.openclaw</code> section declares what the skill needs to run:
      </p>
      <table>
        <thead>
          <tr>
            <th>Field</th>
            <th>Type</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>requires.bins</code></td>
            <td>string[]</td>
            <td>System binaries needed (e.g., <code>curl</code>, <code>python3</code>)</td>
          </tr>
          <tr>
            <td><code>requires.env</code></td>
            <td>string[]</td>
            <td>Environment variables needed (e.g., <code>API_KEY</code>)</td>
          </tr>
          <tr>
            <td><code>requires.skills</code></td>
            <td>string[]</td>
            <td>Other skills this depends on (e.g., <code>skillhub/web-scraper</code>)</td>
          </tr>
        </tbody>
      </table>

      <div className="not-prose bg-primary/5 border border-primary/20 rounded-lg p-4 my-4">
        <p className="text-sm">
          <strong>💡 Tip:</strong> Including proper metadata improves your skill's 
          validation score and helps users understand what they need before installing.
        </p>
      </div>

      <h2>Multi-File Skills</h2>
      <p>
        Skills can include additional files beyond SKILL.md — scripts, configuration files, 
        templates, and more. When publishing via the web interface, you can upload multiple 
        files or a ZIP archive. Via the CLI, all files in the skill directory are included 
        automatically (respecting <code>.skillignore</code> patterns).
      </p>
    </DocsLayout>
  );
}
