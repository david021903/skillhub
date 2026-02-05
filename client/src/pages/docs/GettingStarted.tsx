import DocsLayout from "@/components/DocsLayout";

export default function GettingStarted() {
  return (
    <DocsLayout
      title="What is SkillHub?"
      description="The open registry for OpenClaw AI agent skills"
    >
      <p>
        <strong>SkillHub</strong> is the central registry for discovering, publishing, and installing 
        AI agent skills built for the <strong>OpenClaw</strong> ecosystem. Think of it like npm or 
        GitHub, but for AI agent capabilities.
      </p>

      <h2>Why SkillHub?</h2>
      <p>
        AI agents become more powerful when they can learn new skills. SkillHub makes it easy to:
      </p>
      <ul>
        <li><strong>Discover</strong> — Browse 1,000+ verified skills across categories like coding, research, automation, and more</li>
        <li><strong>Install</strong> — Add skills to your agent with a single command</li>
        <li><strong>Publish</strong> — Share your own skills with the community</li>
        <li><strong>Validate</strong> — Automatic quality and security checks for every skill</li>
        <li><strong>Collaborate</strong> — Open issues, submit pull requests, and fork skills</li>
      </ul>

      <h2>How It Works</h2>
      <p>
        Every skill on SkillHub is defined by a <code>SKILL.md</code> file — a simple Markdown 
        document with YAML metadata at the top. This file tells agents what the skill does, what 
        it requires, and provides the instructions the agent needs to use it.
      </p>

      <div className="not-prose bg-muted/50 border rounded-lg p-4 my-6">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">📦</span>
          <span className="font-semibold text-sm">Example: A skill in 30 seconds</span>
        </div>
        <pre className="bg-[hsl(222,47%,8%)] text-gray-100 rounded-lg p-4 text-sm overflow-x-auto">
{`---
name: web-scraper
version: 1.0.0
description: Scrape and extract data from websites
metadata:
  openclaw:
    requires:
      bins: [curl]
      env: []
---
# Web Scraper

You can scrape websites using curl and parse the HTML...`}
        </pre>
      </div>

      <h2>Two Ways to Use SkillHub</h2>

      <h3>🌐 Web Platform</h3>
      <p>
        Visit <a href="https://skillhub.space">skillhub.space</a> to browse skills, read 
        documentation, star your favorites, and publish new skills through the web interface. 
        No installation required.
      </p>

      <h3>💻 Command Line (shsc)</h3>
      <p>
        For developers who prefer the terminal, the <code>shsc</code> CLI lets you search, 
        install, publish, and validate skills directly from your command line.
      </p>

      <div className="not-prose bg-muted/50 border rounded-lg p-4 my-6">
        <pre className="bg-[hsl(222,47%,8%)] text-gray-100 rounded-lg p-4 text-sm overflow-x-auto">
{`# Install a skill
shsc install skillhub/web-scraper

# Search for skills
shsc search "data extraction"

# Publish your own
shsc publish`}
        </pre>
      </div>

      <h2>What's Next?</h2>
      <p>
        Ready to get started? Head to the <a href="/docs/quick-start">Quick Start</a> guide 
        to create and publish your first skill in under 5 minutes.
      </p>
    </DocsLayout>
  );
}
