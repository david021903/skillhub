import DocsLayout from "@/components/DocsLayout";

export default function TokensCLIUsage() {
  return (
    <DocsLayout
      title="Using Tokens with CLI"
      description="Authenticate the CLI with your API token"
    >
      <h2>Logging In</h2>
      <p>
        After creating a token on the web, use it to authenticate the CLI:
      </p>
      <div className="not-prose bg-muted/50 border rounded-lg p-4 my-4">
        <pre className="bg-[hsl(222,47%,8%)] text-gray-100 rounded-lg p-4 text-sm overflow-x-auto">
{`# Interactive (prompts for token)
shsc auth login

# Direct (provide token inline)
shsc auth login --token sk_your_token_here`}
        </pre>
      </div>

      <h2>How Token Storage Works</h2>
      <p>
        When you log in, the CLI stores your token locally in <code>~/.shsc/config.json</code>. 
        This file contains:
      </p>
      <ul>
        <li>Your API token (encrypted)</li>
        <li>The API URL (default: <code>https://skillhub.space</code>)</li>
      </ul>
      <p>
        The token is automatically included in all subsequent CLI requests.
      </p>

      <h2>Verifying Authentication</h2>
      <div className="not-prose bg-muted/50 border rounded-lg p-4 my-4">
        <pre className="bg-[hsl(222,47%,8%)] text-gray-100 rounded-lg p-4 text-sm overflow-x-auto">
{`shsc auth status

# Output (if logged in):
# ✓ Logged in as yourhandle
# API: https://skillhub.space
#
# Output (if not logged in):
# ✗ Not authenticated
# Run 'shsc auth login' to log in`}
        </pre>
      </div>

      <h2>Using in CI/CD</h2>
      <p>
        For automated environments (GitHub Actions, GitLab CI, etc.), pass the token 
        via the command line flag:
      </p>
      <div className="not-prose bg-muted/50 border rounded-lg p-4 my-4">
        <pre className="bg-[hsl(222,47%,8%)] text-gray-100 rounded-lg p-4 text-sm overflow-x-auto">
{`# In your CI/CD pipeline:
shsc auth login --token $SKILLHUB_TOKEN
shsc publish`}
        </pre>
      </div>
      <p>
        Store the token as a secret in your CI/CD platform (e.g., GitHub Secrets, 
        GitLab CI Variables).
      </p>

      <h2>Multiple Machines</h2>
      <p>
        Each machine you use needs its own login. You can:
      </p>
      <ul>
        <li>Use the same token across machines (simpler, but riskier if one is compromised)</li>
        <li>Create a separate token per machine (recommended — easier to revoke individually)</li>
      </ul>

      <h2>Switching Accounts</h2>
      <div className="not-prose bg-muted/50 border rounded-lg p-4 my-4">
        <pre className="bg-[hsl(222,47%,8%)] text-gray-100 rounded-lg p-4 text-sm overflow-x-auto">
{`# Log out of current account
shsc auth logout

# Log in with a different token
shsc auth login --token sk_different_token`}
        </pre>
      </div>
    </DocsLayout>
  );
}
