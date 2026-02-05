import DocsLayout from "@/components/DocsLayout";

export default function CLI() {
  return (
    <DocsLayout
      title="CLI Installation"
      description="Install the shsc command-line tool"
    >
      <p>
        The <code>shsc</code> (SkillHub Space CLI) is a command-line tool for managing 
        skills directly from your terminal. It provides a fast, developer-friendly interface 
        for all SkillHub operations.
      </p>

      <h2>Installation</h2>
      <p>Install <code>shsc</code> globally using npm:</p>
      <div className="not-prose bg-muted/50 border rounded-lg p-4 my-4">
        <pre className="bg-[hsl(222,47%,8%)] text-gray-100 rounded-lg p-4 text-sm overflow-x-auto">
{`npm install -g shsc`}
        </pre>
      </div>

      <p>Verify the installation:</p>
      <div className="not-prose bg-muted/50 border rounded-lg p-4 my-4">
        <pre className="bg-[hsl(222,47%,8%)] text-gray-100 rounded-lg p-4 text-sm overflow-x-auto">
{`shsc --version
# Output: 1.0.0`}
        </pre>
      </div>

      <h2>Available Commands</h2>
      <table>
        <thead>
          <tr>
            <th>Command</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>shsc auth</code></td>
            <td>Manage authentication (login, logout, status)</td>
          </tr>
          <tr>
            <td><code>shsc init</code></td>
            <td>Initialize a new skill in the current directory</td>
          </tr>
          <tr>
            <td><code>shsc publish</code></td>
            <td>Publish the current skill to SkillHub</td>
          </tr>
          <tr>
            <td><code>shsc install</code></td>
            <td>Install a skill from SkillHub</td>
          </tr>
          <tr>
            <td><code>shsc search</code></td>
            <td>Search for skills</td>
          </tr>
          <tr>
            <td><code>shsc validate</code></td>
            <td>Validate your SKILL.md before publishing</td>
          </tr>
          <tr>
            <td><code>shsc templates</code></td>
            <td>Browse and use skill templates</td>
          </tr>
          <tr>
            <td><code>shsc check</code></td>
            <td>Check skill dependencies</td>
          </tr>
          <tr>
            <td><code>shsc help</code></td>
            <td>Show help for any command</td>
          </tr>
        </tbody>
      </table>

      <h2>Getting Help</h2>
      <div className="not-prose bg-muted/50 border rounded-lg p-4 my-4">
        <pre className="bg-[hsl(222,47%,8%)] text-gray-100 rounded-lg p-4 text-sm overflow-x-auto">
{`# General help
shsc help

# Help for a specific command
shsc help auth
shsc help publish`}
        </pre>
      </div>

      <h2>Configuration</h2>
      <p>
        The CLI stores its configuration (auth tokens, API URL) in <code>~/.shsc/</code>. 
        You typically don't need to edit these files directly — use the <code>shsc auth</code> commands 
        instead.
      </p>

      <h2>Custom API URL</h2>
      <p>
        By default, the CLI connects to <code>https://skillhub.space</code>. If you need 
        to point to a different server (for development or self-hosted instances):
      </p>
      <div className="not-prose bg-muted/50 border rounded-lg p-4 my-4">
        <pre className="bg-[hsl(222,47%,8%)] text-gray-100 rounded-lg p-4 text-sm overflow-x-auto">
{`shsc auth login --api-url https://your-instance.com`}
        </pre>
      </div>
    </DocsLayout>
  );
}
