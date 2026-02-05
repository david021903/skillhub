import DocsLayout from "@/components/DocsLayout";

export default function CLIValidation() {
  return (
    <DocsLayout
      title="CLI Validation"
      description="Validate your skills before publishing"
    >
      <p>
        The <code>validate</code> command checks your SKILL.md against SkillHub's quality 
        standards before you publish. This helps you catch issues early and improve your 
        validation score.
      </p>

      <h2>Basic Usage</h2>
      <div className="not-prose bg-muted/50 border rounded-lg p-4 my-4">
        <pre className="bg-[hsl(222,47%,8%)] text-gray-100 rounded-lg p-4 text-sm overflow-x-auto">
{`# Validate the SKILL.md in the current directory
shsc validate

# Output:
# ✓ Validating skill...
#
# Validation Results:
# ✓ Valid YAML frontmatter
# ✓ Name field present
# ✓ Version follows semver
# ✓ Description provided
# ✓ Content length adequate
# ✗ No permissions declared
# ✗ Missing OpenClaw metadata
#
# Score: 71% (5/7 checks passed)`}
        </pre>
      </div>

      <h2>Options</h2>
      <table>
        <thead>
          <tr>
            <th>Flag</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>-f, --file &lt;path&gt;</code></td>
            <td>Path to SKILL.md file (default: <code>SKILL.md</code> in current dir)</td>
          </tr>
          <tr>
            <td><code>--json</code></td>
            <td>Output results as JSON (useful for CI/CD pipelines)</td>
          </tr>
        </tbody>
      </table>

      <h2>Validating a Specific File</h2>
      <div className="not-prose bg-muted/50 border rounded-lg p-4 my-4">
        <pre className="bg-[hsl(222,47%,8%)] text-gray-100 rounded-lg p-4 text-sm overflow-x-auto">
{`# Validate a specific file
shsc validate --file path/to/SKILL.md`}
        </pre>
      </div>

      <h2>JSON Output</h2>
      <p>For scripting or CI/CD integration:</p>
      <div className="not-prose bg-muted/50 border rounded-lg p-4 my-4">
        <pre className="bg-[hsl(222,47%,8%)] text-gray-100 rounded-lg p-4 text-sm overflow-x-auto">
{`shsc validate --json

# Output:
# {
#   "score": 71,
#   "checks": [
#     { "name": "frontmatter", "passed": true },
#     { "name": "name", "passed": true },
#     { "name": "version", "passed": true },
#     { "name": "description", "passed": true },
#     { "name": "content", "passed": true },
#     { "name": "permissions", "passed": false },
#     { "name": "openclaw_metadata", "passed": false }
#   ]
# }`}
        </pre>
      </div>

      <h2>Online Validator</h2>
      <p>
        You can also validate skills through the web interface at{" "}
        <a href="https://skillhub.space/validate">skillhub.space/validate</a>. 
        Paste your SKILL.md content and get instant validation results with detailed feedback.
      </p>
    </DocsLayout>
  );
}
