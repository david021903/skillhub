import DocsLayout from "@/components/DocsLayout";

export default function CLIAuth() {
  return (
    <DocsLayout
      title="CLI Authentication"
      description="Log in, log out, and check your auth status"
    >
      <p>
        Before you can publish or manage skills from the CLI, you need to authenticate 
        with your SkillHub account using an API token.
      </p>

      <h2>Getting an API Token</h2>
      <ol>
        <li>Sign in to <a href="https://skillhub.space">skillhub.space</a></li>
        <li>Go to <strong>Settings → API Tokens</strong></li>
        <li>Click <strong>Create Token</strong></li>
        <li>Give it a name (e.g., "My Laptop CLI")</li>
        <li>Select scopes: <strong>read</strong> (for browsing/installing) and <strong>write</strong> (for publishing)</li>
        <li>Copy the generated token — you won't be able to see it again</li>
      </ol>

      <h2>Logging In</h2>
      <div className="not-prose bg-muted/50 border rounded-lg p-4 my-4">
        <pre className="bg-[hsl(222,47%,8%)] text-gray-100 rounded-lg p-4 text-sm overflow-x-auto">
{`# Interactive login (prompts for token)
shsc auth login

# Or provide the token directly
shsc auth login --token sk_your_token_here`}
        </pre>
      </div>
      <p>
        The CLI will verify your token and display your username if successful.
      </p>

      <h2>Checking Status</h2>
      <div className="not-prose bg-muted/50 border rounded-lg p-4 my-4">
        <pre className="bg-[hsl(222,47%,8%)] text-gray-100 rounded-lg p-4 text-sm overflow-x-auto">
{`shsc auth status

# Output:
# ✓ Logged in as yourhandle
# API: https://skillhub.space`}
        </pre>
      </div>

      <h2>Logging Out</h2>
      <div className="not-prose bg-muted/50 border rounded-lg p-4 my-4">
        <pre className="bg-[hsl(222,47%,8%)] text-gray-100 rounded-lg p-4 text-sm overflow-x-auto">
{`shsc auth logout

# Output:
# ✓ Logged out successfully`}
        </pre>
      </div>
      <p>
        This removes your stored token from the local configuration.
      </p>

      <h2>Token Security</h2>
      <div className="not-prose bg-destructive/5 border border-destructive/20 rounded-lg p-4 my-4">
        <p className="text-sm">
          <strong>⚠️ Important:</strong> Treat your API tokens like passwords. Never commit 
          them to version control, share them publicly, or include them in scripts that 
          others can access. If a token is compromised, revoke it immediately from 
          Settings → API Tokens.
        </p>
      </div>
    </DocsLayout>
  );
}
