import DocsLayout from "@/components/DocsLayout";

export default function SkillFormatBody() {
  return (
    <DocsLayout
      title="Markdown Body"
      description="Writing effective skill instructions"
    >
      <p>
        The body of your SKILL.md file — everything below the YAML frontmatter — contains 
        the actual instructions that agents will follow. This is standard Markdown.
      </p>

      <h2>Recommended Structure</h2>
      <p>A well-structured skill body typically includes these sections:</p>

      <div className="not-prose bg-muted/50 border rounded-lg p-4 my-6">
        <pre className="bg-[hsl(222,47%,8%)] text-gray-100 rounded-lg p-4 text-sm overflow-x-auto">
{`# Skill Name

A paragraph explaining what this skill does and when to use it.

## Instructions

Step-by-step instructions for the agent to follow.

## Examples

### Example 1: Basic Usage
Show the agent what input/output looks like.

### Example 2: Advanced Usage
More complex scenarios.

## Notes

Any caveats, limitations, or important details.`}
        </pre>
      </div>

      <h2>Best Practices</h2>

      <h3>Be Specific</h3>
      <p>
        Write instructions as if you're explaining to a capable but literal assistant. 
        Be explicit about what to do, in what order, and how to handle edge cases.
      </p>

      <h3>Include Examples</h3>
      <p>
        Show concrete input/output examples. Agents learn best from seeing what "good" 
        looks like. Use code blocks for any code or command output.
      </p>

      <h3>Use Code Blocks</h3>
      <p>
        Wrap commands, code snippets, and file contents in fenced code blocks with 
        language identifiers:
      </p>
      <div className="not-prose bg-muted/50 border rounded-lg p-4 my-4">
        <pre className="bg-[hsl(222,47%,8%)] text-gray-100 rounded-lg p-4 text-sm overflow-x-auto">
{`\`\`\`bash
curl -X GET https://api.example.com/data
\`\`\`

\`\`\`python
import requests
response = requests.get("https://api.example.com/data")
\`\`\``}
        </pre>
      </div>

      <h3>Break Down Complex Tasks</h3>
      <p>
        Use numbered lists for sequential steps and bullet points for options or 
        non-sequential items.
      </p>

      <h3>Document Error Handling</h3>
      <p>
        Include guidance on what to do when things go wrong. What errors might occur? 
        How should the agent recover?
      </p>

      <h2>Markdown Features Supported</h2>
      <ul>
        <li>Headings (<code># H1</code> through <code>###### H6</code>)</li>
        <li>Bold, italic, strikethrough text</li>
        <li>Ordered and unordered lists</li>
        <li>Fenced code blocks with syntax highlighting</li>
        <li>Tables</li>
        <li>Links and images</li>
        <li>Blockquotes</li>
        <li>Horizontal rules</li>
      </ul>
    </DocsLayout>
  );
}
