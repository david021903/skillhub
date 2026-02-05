import DocsLayout from "@/components/DocsLayout";

export default function Tokens() {
  return (
    <DocsLayout
      title="API Tokens Overview"
      description="Authenticate with the CLI and API"
    >
      <p>
        API tokens let you authenticate with SkillHub from the command line (CLI) or 
        programmatically via the API. They act like passwords but are more secure — you 
        can create multiple tokens, control their permissions, and revoke them individually.
      </p>

      <h2>Why Use Tokens?</h2>
      <ul>
        <li><strong>CLI Authentication</strong> — Log into the <code>shsc</code> CLI to publish and manage skills</li>
        <li><strong>Automation</strong> — Use tokens in CI/CD pipelines for automated publishing</li>
        <li><strong>Scoped Access</strong> — Create read-only tokens for scripts that only need to install skills</li>
        <li><strong>Revocable</strong> — If a token is compromised, revoke just that token without changing your password</li>
      </ul>

      <h2>Token Prefix</h2>
      <p>
        All SkillHub tokens start with <code>sk_</code> followed by a unique identifier. 
        This makes them easy to identify in logs or if accidentally exposed.
      </p>

      <h2>Quick Start</h2>
      <ol>
        <li>Go to <strong>Settings → API Tokens</strong></li>
        <li>Click <strong>Create Token</strong></li>
        <li>Name your token and select scopes</li>
        <li>Copy the token (shown only once)</li>
        <li>Use it with the CLI: <code>shsc auth login --token sk_your_token</code></li>
      </ol>

      <div className="not-prose bg-destructive/5 border border-destructive/20 rounded-lg p-4 my-4">
        <p className="text-sm">
          <strong>⚠️ Important:</strong> Your token is shown only once when created. 
          If you lose it, you'll need to create a new one. Store it securely (e.g., in 
          a password manager).
        </p>
      </div>
    </DocsLayout>
  );
}
