import DocsLayout from "@/components/DocsLayout";

export default function TokensScopes() {
  return (
    <DocsLayout
      title="Scopes & Permissions"
      description="Control what each token can do"
    >
      <p>
        Scopes control what actions a token can perform. Following the principle of 
        least privilege, only grant the scopes a token actually needs.
      </p>

      <h2>Available Scopes</h2>
      <table>
        <thead>
          <tr>
            <th>Scope</th>
            <th>Allows</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>read</code></td>
            <td>
              <ul className="list-none p-0 m-0">
                <li>Search for skills</li>
                <li>Install skills</li>
                <li>View skill details</li>
                <li>Check authentication status</li>
                <li>Validate SKILL.md files</li>
                <li>Check dependencies</li>
              </ul>
            </td>
          </tr>
          <tr>
            <td><code>write</code></td>
            <td>
              <ul className="list-none p-0 m-0">
                <li>Create new skills</li>
                <li>Publish new versions</li>
                <li>Update skill metadata</li>
                <li>Everything in <code>read</code> scope</li>
              </ul>
            </td>
          </tr>
        </tbody>
      </table>

      <h2>Recommended Token Setups</h2>

      <h3>For Daily CLI Use</h3>
      <p>
        If you use the CLI to both browse and publish skills:
      </p>
      <ul>
        <li>Scopes: <code>read</code> + <code>write</code></li>
      </ul>

      <h3>For CI/CD Pipelines</h3>
      <p>
        If you have automated publishing (e.g., from GitHub Actions):
      </p>
      <ul>
        <li>Scopes: <code>read</code> + <code>write</code></li>
        <li>Create a dedicated token named after the pipeline</li>
      </ul>

      <h3>For Read-Only Scripts</h3>
      <p>
        If you have a script that only needs to install or search for skills:
      </p>
      <ul>
        <li>Scopes: <code>read</code> only</li>
        <li>This prevents accidental publishes or modifications</li>
      </ul>

      <h2>Scope Enforcement</h2>
      <p>
        If a token tries to perform an action outside its scopes, the API returns a 
        <code>403 Forbidden</code> error:
      </p>
      <div className="not-prose bg-muted/50 border rounded-lg p-4 my-4">
        <pre className="bg-[hsl(222,47%,8%)] text-gray-100 rounded-lg p-4 text-sm overflow-x-auto">
{`# Using a read-only token to publish:
shsc publish

# Error: Insufficient scope. This action requires 'write' scope.
# Your token only has: read`}
        </pre>
      </div>
    </DocsLayout>
  );
}
