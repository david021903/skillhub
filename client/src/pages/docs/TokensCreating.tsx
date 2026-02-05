import DocsLayout from "@/components/DocsLayout";

export default function TokensCreating() {
  return (
    <DocsLayout
      title="Creating Tokens"
      description="Generate and manage your API tokens"
    >
      <h2>Creating a New Token</h2>
      <ol>
        <li>Sign in to <a href="https://skillhub.space">skillhub.space</a></li>
        <li>Click your avatar in the top right</li>
        <li>Select <strong>Settings</strong></li>
        <li>Go to the <strong>API Tokens</strong> tab</li>
        <li>Click <strong>Create Token</strong></li>
        <li>Enter a descriptive name (e.g., "Laptop CLI", "GitHub Actions", "Read-only Script")</li>
        <li>Select the scopes you need</li>
        <li>Click <strong>Create</strong></li>
        <li>Copy the token immediately — it won't be shown again</li>
      </ol>

      <h2>Token Names</h2>
      <p>
        Give each token a descriptive name so you know what it's used for. Good naming examples:
      </p>
      <ul>
        <li>"Work Laptop CLI" — for your development machine</li>
        <li>"CI/CD Pipeline" — for automated deployments</li>
        <li>"Read-only Script" — for scripts that only install skills</li>
      </ul>

      <h2>Managing Existing Tokens</h2>
      <p>
        The API Tokens page shows all your active tokens with:
      </p>
      <ul>
        <li>Token name</li>
        <li>Assigned scopes (read, write)</li>
        <li>Creation date</li>
        <li>A <strong>Revoke</strong> button to delete the token</li>
      </ul>

      <h2>Revoking Tokens</h2>
      <p>
        To revoke a token:
      </p>
      <ol>
        <li>Go to <strong>Settings → API Tokens</strong></li>
        <li>Find the token you want to revoke</li>
        <li>Click the <strong>Revoke</strong> button</li>
        <li>Confirm the action</li>
      </ol>
      <p>
        Revoked tokens immediately stop working. Any CLI sessions or scripts using 
        that token will need to re-authenticate with a new token.
      </p>

      <div className="not-prose bg-primary/5 border border-primary/20 rounded-lg p-4 my-4">
        <p className="text-sm">
          <strong>💡 Tip:</strong> Create separate tokens for different machines or 
          purposes. This way, if one is compromised, you only need to revoke that 
          specific token.
        </p>
      </div>
    </DocsLayout>
  );
}
