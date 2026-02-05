import DocsLayout from "@/components/DocsLayout";

export default function CLIDependencies() {
  return (
    <DocsLayout
      title="Dependency Checking"
      description="Verify that all skill requirements are met"
    >
      <p>
        The <code>check</code> command verifies that all dependencies declared in a skill's 
        SKILL.md are available on your system. This prevents issues when running skills 
        that need specific tools or environment variables.
      </p>

      <h2>Checking Dependencies</h2>
      <div className="not-prose bg-muted/50 border rounded-lg p-4 my-4">
        <pre className="bg-[hsl(222,47%,8%)] text-gray-100 rounded-lg p-4 text-sm overflow-x-auto">
{`shsc check deps

# Output:
# Checking dependencies for my-skill...
#
# Binaries:
#   ✓ python3 (found at /usr/bin/python3)
#   ✓ curl (found at /usr/bin/curl)
#   ✗ docker (not found)
#
# Environment Variables:
#   ✓ API_KEY (set)
#   ✗ DATABASE_URL (not set)
#
# Skills:
#   ✓ skillhub/web-scraper (installed)
#   ✗ skillhub/json-parser (not installed)
#
# 3/6 dependencies satisfied`}
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
        </tbody>
      </table>

      <h2>Getting Install Instructions</h2>
      <p>
        When dependencies are missing, use <code>install-deps</code> to see how to install them:
      </p>
      <div className="not-prose bg-muted/50 border rounded-lg p-4 my-4">
        <pre className="bg-[hsl(222,47%,8%)] text-gray-100 rounded-lg p-4 text-sm overflow-x-auto">
{`shsc check install-deps

# Output:
# Missing dependencies and how to install them:
#
# docker:
#   macOS:   brew install docker
#   Ubuntu:  sudo apt install docker.io
#   Website: https://docs.docker.com/get-docker/
#
# DATABASE_URL:
#   Set this environment variable:
#   export DATABASE_URL="your_connection_string"
#
# skillhub/json-parser:
#   shsc install skillhub/json-parser`}
        </pre>
      </div>

      <h2>What Gets Checked</h2>
      <p>
        The dependency checker reads the <code>metadata.openclaw.requires</code> section 
        of your SKILL.md and verifies three types of dependencies:
      </p>
      <ul>
        <li><strong>Binaries</strong> (<code>bins</code>) — Checks if the command exists in your PATH using <code>which</code></li>
        <li><strong>Environment Variables</strong> (<code>env</code>) — Checks if the variable is set (doesn't validate its value)</li>
        <li><strong>Skills</strong> (<code>skills</code>) — Checks if the skill is installed in <code>.local/skills/</code></li>
      </ul>

      <div className="not-prose bg-primary/5 border border-primary/20 rounded-lg p-4 my-4">
        <p className="text-sm">
          <strong>💡 Tip:</strong> Run <code>shsc check deps</code> after installing a 
          skill to make sure you have everything needed to use it.
        </p>
      </div>
    </DocsLayout>
  );
}
