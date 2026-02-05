import DocsLayout from "@/components/DocsLayout";

export default function ValidationCriteria() {
  return (
    <DocsLayout
      title="Scoring Criteria"
      description="Detailed breakdown of each validation check"
    >
      <h2>Check 1: Valid Frontmatter</h2>
      <p>
        The YAML frontmatter between <code>---</code> delimiters must be valid, parseable YAML.
      </p>
      <div className="not-prose flex gap-4 my-4">
        <div className="flex-1 bg-green-500/5 border border-green-500/20 rounded-lg p-4">
          <div className="text-sm font-medium text-green-600 mb-2">✅ Passes</div>
          <pre className="text-xs bg-[hsl(222,47%,8%)] text-gray-100 rounded p-3 overflow-x-auto">
{`---
name: my-skill
version: 1.0.0
description: A skill
---`}
          </pre>
        </div>
        <div className="flex-1 bg-red-500/5 border border-red-500/20 rounded-lg p-4">
          <div className="text-sm font-medium text-red-600 mb-2">❌ Fails</div>
          <pre className="text-xs bg-[hsl(222,47%,8%)] text-gray-100 rounded p-3 overflow-x-auto">
{`---
name: my-skill
  bad indentation: here
version 1.0.0
---`}
          </pre>
        </div>
      </div>

      <h2>Check 2: Required Fields</h2>
      <p>
        The frontmatter must include <code>name</code>, <code>version</code>, and 
        <code>description</code> fields with non-empty values.
      </p>

      <h2>Check 3: Semantic Versioning</h2>
      <p>
        The version must follow the <code>MAJOR.MINOR.PATCH</code> format.
      </p>
      <ul>
        <li>✅ <code>1.0.0</code>, <code>2.3.1</code>, <code>0.1.0</code></li>
        <li>❌ <code>1.0</code>, <code>v1.0.0</code>, <code>latest</code></li>
      </ul>

      <h2>Check 4: Content Quality</h2>
      <p>
        The markdown body (below the frontmatter) must be substantial enough to provide 
        meaningful instructions. Very short or empty skill bodies will fail this check.
      </p>

      <h2>Check 5: Security Scan</h2>
      <p>
        The validator scans for potentially dangerous patterns:
      </p>
      <ul>
        <li>Hardcoded API keys or tokens (e.g., strings matching <code>sk-</code>, <code>api_key=</code>)</li>
        <li>Hardcoded passwords or credentials</li>
        <li>Suspicious system commands (e.g., <code>rm -rf /</code>)</li>
        <li>Base64-encoded payloads that might hide malicious content</li>
      </ul>

      <h2>Check 6: Permissions Declaration</h2>
      <p>
        Skills should declare what permissions they need in the 
        <code>metadata.openclaw.permissions</code> array:
      </p>
      <div className="not-prose bg-muted/50 border rounded-lg p-4 my-4">
        <pre className="bg-[hsl(222,47%,8%)] text-gray-100 rounded-lg p-4 text-sm overflow-x-auto">
{`metadata:
  openclaw:
    permissions:
      - network       # Makes HTTP requests
      - filesystem     # Reads/writes files
      - subprocess     # Runs shell commands
      - environment    # Reads env variables`}
        </pre>
      </div>

      <h2>Check 7: OpenClaw Metadata</h2>
      <p>
        The <code>metadata.openclaw</code> section should be present with at least 
        the <code>requires</code> field declaring dependencies:
      </p>
      <div className="not-prose bg-muted/50 border rounded-lg p-4 my-4">
        <pre className="bg-[hsl(222,47%,8%)] text-gray-100 rounded-lg p-4 text-sm overflow-x-auto">
{`metadata:
  openclaw:
    requires:
      bins: []    # Even if empty, declare it
      env: []
      skills: []`}
        </pre>
      </div>
    </DocsLayout>
  );
}
