import DocsLayout from "@/components/DocsLayout";

export default function PlatformForking() {
  return (
    <DocsLayout
      title="Forking Skills"
      description="Create your own copy of any skill"
    >
      <p>
        Forking lets you create a personal copy of any public skill. Your fork is completely 
        independent — you can modify it however you want without affecting the original.
      </p>

      <h2>How to Fork</h2>
      <ol>
        <li>Go to the skill you want to fork</li>
        <li>Click the <strong>Fork</strong> button</li>
        <li>The skill is copied to your account with all its files and content</li>
      </ol>

      <h2>What Gets Copied</h2>
      <ul>
        <li>The SKILL.md content</li>
        <li>All associated files</li>
        <li>The skill's metadata and description</li>
      </ul>

      <h2>What Doesn't Get Copied</h2>
      <ul>
        <li>Stars — your fork starts at 0 stars</li>
        <li>Downloads — your fork starts at 0 downloads</li>
        <li>Issues and pull requests — these stay on the original</li>
        <li>Version history — your fork starts fresh at the current version</li>
      </ul>

      <h2>Fork Attribution</h2>
      <p>
        Forked skills show a "Forked from" link on their detail page, giving credit to 
        the original author. The original skill also shows a fork count so authors can 
        see how many people have built on their work.
      </p>

      <h2>When to Fork</h2>
      <ul>
        <li><strong>Customization</strong> — Adapt a skill for your specific use case</li>
        <li><strong>Experimentation</strong> — Try changes without affecting the original</li>
        <li><strong>Building on existing work</strong> — Use a skill as a starting point for something new</li>
      </ul>

      <div className="not-prose bg-primary/5 border border-primary/20 rounded-lg p-4 my-4">
        <p className="text-sm">
          <strong>💡 Tip:</strong> If your changes would benefit everyone, consider submitting 
          a pull request to the original skill instead of (or in addition to) forking.
        </p>
      </div>
    </DocsLayout>
  );
}
