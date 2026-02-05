import DocsLayout from "@/components/DocsLayout";

export default function CLIPublishInstall() {
  return (
    <DocsLayout
      title="Publishing & Installing"
      description="Publish your skills and install others from the CLI"
    >
      <h2>Initializing a New Skill</h2>
      <p>
        Create a new skill in the current directory with <code>shsc init</code>:
      </p>
      <div className="not-prose bg-muted/50 border rounded-lg p-4 my-4">
        <pre className="bg-[hsl(222,47%,8%)] text-gray-100 rounded-lg p-4 text-sm overflow-x-auto">
{`# Create a SKILL.md in the current directory
shsc init

# Or specify a name
shsc init --name "my-awesome-skill"

# With a custom slug
shsc init --name "My Skill" --slug my-skill`}
        </pre>
      </div>
      <p>
        This generates a template SKILL.md file with the proper frontmatter structure 
        that you can edit.
      </p>

      <h2>Publishing a Skill</h2>
      <p>
        From the directory containing your SKILL.md, run:
      </p>
      <div className="not-prose bg-muted/50 border rounded-lg p-4 my-4">
        <pre className="bg-[hsl(222,47%,8%)] text-gray-100 rounded-lg p-4 text-sm overflow-x-auto">
{`shsc publish

# Output:
# ✓ Reading SKILL.md...
# ✓ Collecting files...
#   Found 3 files (SKILL.md, scripts/setup.sh, config.yaml)
# ✓ Publishing my-skill v1.0.0...
# ✓ Validation passed (score: 86%)
# ✓ Published successfully!
#
# View at: https://skillhub.space/skills/yourhandle/my-skill`}
        </pre>
      </div>

      <h3>What Gets Published</h3>
      <p>The CLI collects all text files in the current directory, except:</p>
      <ul>
        <li>Files matching patterns in <code>.skillignore</code></li>
        <li>Hidden files and directories (starting with <code>.</code>)</li>
        <li><code>node_modules/</code>, <code>.git/</code>, and other common ignore patterns</li>
      </ul>

      <h3>.skillignore</h3>
      <p>
        Create a <code>.skillignore</code> file to exclude files from publishing:
      </p>
      <div className="not-prose bg-muted/50 border rounded-lg p-4 my-4">
        <pre className="bg-[hsl(222,47%,8%)] text-gray-100 rounded-lg p-4 text-sm overflow-x-auto">
{`# Exclude test files
tests/
*.test.js

# Exclude local config
.env
.env.local

# Exclude build artifacts
dist/
build/`}
        </pre>
      </div>

      <h2>Installing Skills</h2>
      <p>
        Install a skill from SkillHub to your local <code>.local/skills/</code> directory:
      </p>
      <div className="not-prose bg-muted/50 border rounded-lg p-4 my-4">
        <pre className="bg-[hsl(222,47%,8%)] text-gray-100 rounded-lg p-4 text-sm overflow-x-auto">
{`# Install a skill
shsc install owner/skill-name

# Example:
shsc install skillhub/web-scraper

# Output:
# ✓ Downloading skillhub/web-scraper v1.2.0...
# ✓ Extracting 4 files...
# ✓ Installed to .local/skills/web-scraper/`}
        </pre>
      </div>

      <h3>Where Skills Are Installed</h3>
      <p>
        Skills are installed to <code>.local/skills/&lt;skill-name&gt;/</code> in your 
        current directory. This is the standard location where OpenClaw agents look for 
        installed skills.
      </p>

      <h2>Viewing Skill Info</h2>
      <div className="not-prose bg-muted/50 border rounded-lg p-4 my-4">
        <pre className="bg-[hsl(222,47%,8%)] text-gray-100 rounded-lg p-4 text-sm overflow-x-auto">
{`shsc info skillhub/web-scraper

# Output:
# web-scraper by skillhub
# Version: 1.2.0
# Stars: 42 | Downloads: 156
# Description: Scrape and extract data from websites`}
        </pre>
      </div>

      <h2>Listing Your Skills</h2>
      <div className="not-prose bg-muted/50 border rounded-lg p-4 my-4">
        <pre className="bg-[hsl(222,47%,8%)] text-gray-100 rounded-lg p-4 text-sm overflow-x-auto">
{`shsc list

# Output:
# Your skills:
# 1. my-skill (v1.0.0) - 5 stars, 12 downloads
# 2. another-skill (v2.1.0) - 15 stars, 89 downloads`}
        </pre>
      </div>

      <h2>Starring Skills</h2>
      <div className="not-prose bg-muted/50 border rounded-lg p-4 my-4">
        <pre className="bg-[hsl(222,47%,8%)] text-gray-100 rounded-lg p-4 text-sm overflow-x-auto">
{`# Star a skill
shsc star skillhub/web-scraper

# Unstar (toggle)
shsc star skillhub/web-scraper`}
        </pre>
      </div>
    </DocsLayout>
  );
}
