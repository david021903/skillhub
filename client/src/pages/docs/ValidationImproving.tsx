import DocsLayout from "@/components/DocsLayout";

export default function ValidationImproving() {
  return (
    <DocsLayout
      title="Improving Your Score"
      description="How to get your skill to 100%"
    >
      <p>
        Most skills score around 71% when first published. Here's how to get to 100%.
      </p>

      <h2>The Most Common Missing Checks</h2>

      <h3>1. Add Permissions (usually worth ~14%)</h3>
      <p>
        The most common missing piece is the permissions declaration. Even if your skill 
        doesn't need special permissions, declare an empty array:
      </p>
      <div className="not-prose bg-muted/50 border rounded-lg p-4 my-4">
        <pre className="bg-[hsl(222,47%,8%)] text-gray-100 rounded-lg p-4 text-sm overflow-x-auto">
{`metadata:
  openclaw:
    requires:
      bins: []
      env: []
    permissions:
      - filesystem    # If your skill reads/writes files`}
        </pre>
      </div>

      <h3>2. Add Full OpenClaw Metadata (usually worth ~14%)</h3>
      <p>
        Make sure you have the complete <code>metadata.openclaw</code> structure with 
        <code>requires</code> fields:
      </p>
      <div className="not-prose bg-muted/50 border rounded-lg p-4 my-4">
        <pre className="bg-[hsl(222,47%,8%)] text-gray-100 rounded-lg p-4 text-sm overflow-x-auto">
{`metadata:
  openclaw:
    requires:
      bins: [python3]
      env: [API_KEY]
      skills: []
    permissions:
      - network
      - subprocess`}
        </pre>
      </div>

      <h2>Checklist for 100%</h2>
      <table>
        <thead>
          <tr>
            <th>Check</th>
            <th>How to Pass</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Valid Frontmatter</td>
            <td>Use proper YAML syntax between <code>---</code> delimiters</td>
          </tr>
          <tr>
            <td>Required Fields</td>
            <td>Include <code>name</code>, <code>version</code>, <code>description</code></td>
          </tr>
          <tr>
            <td>Semantic Version</td>
            <td>Use <code>X.Y.Z</code> format (e.g., <code>1.0.0</code>)</td>
          </tr>
          <tr>
            <td>Content Quality</td>
            <td>Write substantial instructions (100+ words recommended)</td>
          </tr>
          <tr>
            <td>Security</td>
            <td>No hardcoded keys, passwords, or dangerous commands</td>
          </tr>
          <tr>
            <td>Permissions</td>
            <td>Add <code>permissions</code> array to metadata</td>
          </tr>
          <tr>
            <td>OpenClaw Metadata</td>
            <td>Include <code>metadata.openclaw.requires</code> section</td>
          </tr>
        </tbody>
      </table>

      <h2>Perfect Score Template</h2>
      <p>Here's a template that passes all checks:</p>
      <div className="not-prose bg-muted/50 border rounded-lg p-4 my-6">
        <pre className="bg-[hsl(222,47%,8%)] text-gray-100 rounded-lg p-4 text-sm overflow-x-auto">
{`---
name: perfect-skill
version: 1.0.0
description: A skill that scores 100% on validation
metadata:
  openclaw:
    requires:
      bins: []
      env: []
      skills: []
    permissions:
      - filesystem
---
# Perfect Skill

This skill demonstrates how to achieve a perfect 
validation score on SkillHub.

## Instructions

1. Follow these detailed steps...
2. The agent should...
3. When complete...

## Examples

### Example 1
Input: ...
Output: ...

## Notes

- This skill requires no external dependencies
- It only reads local files (filesystem permission)`}
        </pre>
      </div>

      <h2>Validate Before Publishing</h2>
      <p>
        Always run validation before publishing to catch issues early:
      </p>
      <div className="not-prose bg-muted/50 border rounded-lg p-4 my-4">
        <pre className="bg-[hsl(222,47%,8%)] text-gray-100 rounded-lg p-4 text-sm overflow-x-auto">
{`# Via CLI
shsc validate

# Via web
# Visit skillhub.space/validate`}
        </pre>
      </div>
    </DocsLayout>
  );
}
