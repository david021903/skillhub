import DocsLayout from "@/components/DocsLayout";

export default function PlatformPublishing() {
  return (
    <DocsLayout
      title="Publishing Skills"
      description="Share your skills with the community"
    >
      <p>
        Publishing a skill makes it available for anyone to discover and install. You can 
        publish through the web interface or the CLI.
      </p>

      <h2>Publishing via Web</h2>
      <ol>
        <li>Sign in to your SkillHub account</li>
        <li>Click the <strong>+</strong> button in the top navigation</li>
        <li>Fill in the required fields:
          <ul>
            <li><strong>Name</strong> — Display name for your skill</li>
            <li><strong>Slug</strong> — URL-friendly identifier (auto-generated from name)</li>
            <li><strong>Description</strong> — Brief summary (shown in search results)</li>
          </ul>
        </li>
        <li>Write or paste your SKILL.md content in the editor</li>
        <li>Choose visibility: <strong>Public</strong> or <strong>Private</strong></li>
        <li>Click <strong>Create Skill</strong></li>
      </ol>

      <h2>Uploading Files</h2>
      <p>Skills can include multiple files. You have two upload options:</p>

      <h3>Drag & Drop Individual Files</h3>
      <p>
        Drag files into the upload area on the create skill page. You can upload scripts, 
        configuration files, templates, and other supporting files.
      </p>

      <h3>ZIP Archive Upload</h3>
      <p>
        Upload a ZIP file containing your entire skill directory. SkillHub will automatically 
        extract the contents and organize them in the file browser. This is the easiest way 
        to upload skills with complex directory structures.
      </p>

      <div className="not-prose bg-primary/5 border border-primary/20 rounded-lg p-4 my-4">
        <p className="text-sm">
          <strong>💡 Tip:</strong> The SKILL.md file should always be at the root of your 
          skill directory. Additional files are referenced relative to this location.
        </p>
      </div>

      <h2>Visibility Settings</h2>
      <ul>
        <li><strong>Public</strong> — Anyone can find and install this skill</li>
        <li><strong>Private</strong> — Only you can see this skill (useful for work-in-progress)</li>
      </ul>
      <p>
        You can change visibility at any time from the skill's settings.
      </p>

      <h2>Slug Rules</h2>
      <p>The slug is the URL identifier for your skill. It must:</p>
      <ul>
        <li>Be lowercase</li>
        <li>Use only letters, numbers, and hyphens</li>
        <li>Start with a letter</li>
        <li>Be unique within your account</li>
      </ul>
      <p>
        Your skill URL will be: <code>skillhub.space/skills/yourhandle/your-slug</code>
      </p>

      <h2>After Publishing</h2>
      <p>Once published, your skill:</p>
      <ul>
        <li>Appears in search results and the browse page</li>
        <li>Gets automatically validated with a quality score</li>
        <li>Can be installed via CLI: <code>shsc install yourhandle/your-slug</code></li>
        <li>Gets its own detail page with file browser, issues, and pull requests</li>
      </ul>
    </DocsLayout>
  );
}
