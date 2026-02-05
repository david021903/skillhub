import DocsLayout from "@/components/DocsLayout";

export default function CLITemplates() {
  return (
    <DocsLayout
      title="Templates"
      description="Kickstart skills with starter templates"
    >
      <p>
        Templates provide pre-built SKILL.md structures for common skill types. They help 
        you get started quickly with proper formatting and best practices.
      </p>

      <h2>Listing Templates</h2>
      <div className="not-prose bg-muted/50 border rounded-lg p-4 my-4">
        <pre className="bg-[hsl(222,47%,8%)] text-gray-100 rounded-lg p-4 text-sm overflow-x-auto">
{`shsc templates list

# Output:
# Available templates:
#
# 1. basic          - A minimal skill template
# 2. api-tool       - Skill that interacts with APIs
# 3. data-processor - Process and transform data
# 4. automation     - Automate workflows and tasks
# 5. research       - Research and analysis skill`}
        </pre>
      </div>

      <h3>Filtering by Category</h3>
      <div className="not-prose bg-muted/50 border rounded-lg p-4 my-4">
        <pre className="bg-[hsl(222,47%,8%)] text-gray-100 rounded-lg p-4 text-sm overflow-x-auto">
{`shsc templates list --category automation`}
        </pre>
      </div>

      <h2>Viewing Template Details</h2>
      <div className="not-prose bg-muted/50 border rounded-lg p-4 my-4">
        <pre className="bg-[hsl(222,47%,8%)] text-gray-100 rounded-lg p-4 text-sm overflow-x-auto">
{`shsc templates show api-tool

# Shows the full template details including
# the SKILL.md content you'll get`}
        </pre>
      </div>

      <h2>Creating a Skill from a Template</h2>
      <div className="not-prose bg-muted/50 border rounded-lg p-4 my-4">
        <pre className="bg-[hsl(222,47%,8%)] text-gray-100 rounded-lg p-4 text-sm overflow-x-auto">
{`# Initialize a new skill using the api-tool template
shsc templates init api-tool

# Output:
# ✓ Created SKILL.md from 'api-tool' template
# 
# Next steps:
# 1. Edit SKILL.md to customize your skill
# 2. Run 'shsc validate' to check formatting
# 3. Run 'shsc publish' when ready`}
        </pre>
      </div>

      <h2>Template vs. Init</h2>
      <p>
        Both <code>shsc init</code> and <code>shsc templates init</code> create a SKILL.md 
        file, but:
      </p>
      <ul>
        <li><code>shsc init</code> — Creates a minimal, blank SKILL.md with just the basic structure</li>
        <li><code>shsc templates init &lt;template&gt;</code> — Creates a filled-out SKILL.md 
          with example content, instructions, and category-specific sections</li>
      </ul>

      <div className="not-prose bg-primary/5 border border-primary/20 rounded-lg p-4 my-4">
        <p className="text-sm">
          <strong>💡 Tip:</strong> Use templates when you're new to writing skills — they 
          show you what a well-structured skill looks like and include placeholders to 
          fill in.
        </p>
      </div>
    </DocsLayout>
  );
}
