import DocsLayout from "@/components/DocsLayout";

export default function QuickStart() {
  return (
    <DocsLayout
      title="Quick Start"
      description="Create and publish your first skill in under 5 minutes"
    >
      <p>
        This guide walks you through creating a SkillHub account, writing your first skill, 
        and publishing it to the registry.
      </p>

      <h2>Step 1: Create an Account</h2>
      <p>
        Visit <a href="https://skillhub.space">skillhub.space</a> and click <strong>Sign In</strong>. 
        You can register with your email or sign in with Google.
      </p>
      <div className="not-prose bg-primary/5 border border-primary/20 rounded-lg p-4 my-4">
        <p className="text-sm">
          <strong>💡 Tip:</strong> Choose a memorable handle — it becomes part of your skill URLs 
          (e.g., <code>skillhub.space/skills/yourname/my-skill</code>).
        </p>
      </div>

      <h2>Step 2: Create Your First Skill</h2>

      <h3>Option A: Using the Web Interface</h3>
      <ol>
        <li>Click the <strong>+</strong> button in the top navigation bar</li>
        <li>Fill in the skill name, slug (URL-friendly name), and description</li>
        <li>Write or paste your SKILL.md content</li>
        <li>Optionally upload additional files (or a ZIP archive)</li>
        <li>Choose visibility: Public or Private</li>
        <li>Click <strong>Create Skill</strong></li>
      </ol>

      <h3>Option B: Using the CLI</h3>
      <div className="not-prose bg-muted/50 border rounded-lg p-4 my-4">
        <pre className="bg-[hsl(222,47%,8%)] text-gray-100 rounded-lg p-4 text-sm overflow-x-auto">
{`# Install the CLI
npm install -g shsc

# Login with your API token
shsc auth login

# Create a new skill in the current directory
shsc init

# Edit the generated SKILL.md file
# Then publish it
shsc publish`}
        </pre>
      </div>

      <h2>Step 3: Write Your SKILL.md</h2>
      <p>
        Every skill needs a <code>SKILL.md</code> file. Here's a minimal example:
      </p>
      <div className="not-prose bg-muted/50 border rounded-lg p-4 my-4">
        <pre className="bg-[hsl(222,47%,8%)] text-gray-100 rounded-lg p-4 text-sm overflow-x-auto">
{`---
name: my-first-skill
version: 1.0.0
description: A simple skill that greets users
metadata:
  openclaw:
    requires:
      bins: []
      env: []
---
# My First Skill

This skill teaches the agent to greet users warmly.

## Instructions

When asked to greet someone, respond with a friendly, 
personalized greeting that includes their name and 
a relevant comment about the time of day.`}
        </pre>
      </div>

      <h2>Step 4: Publish</h2>
      <p>
        Once your skill is created, it's live on SkillHub! Others can find it by searching, 
        and install it with:
      </p>
      <div className="not-prose bg-muted/50 border rounded-lg p-4 my-4">
        <pre className="bg-[hsl(222,47%,8%)] text-gray-100 rounded-lg p-4 text-sm overflow-x-auto">
{`shsc install yourname/my-first-skill`}
        </pre>
      </div>

      <h2>What's Next?</h2>
      <ul>
        <li>Learn the full <a href="/docs/skill-format">SKILL.md format</a> to write better skills</li>
        <li>Explore the <a href="/docs/cli">CLI reference</a> for all available commands</li>
        <li>Understand <a href="/docs/validation">validation scoring</a> to improve your skill quality</li>
      </ul>
    </DocsLayout>
  );
}
