import DocsLayout from "@/components/DocsLayout";

export default function PlatformCollaboration() {
  return (
    <DocsLayout
      title="Issues & Pull Requests"
      description="Collaborate and improve skills together"
    >
      <p>
        SkillHub includes GitHub-like collaboration features — you can open issues to report 
        problems and submit pull requests to propose changes.
      </p>

      <h2>Issues</h2>
      <p>
        Issues are used to report bugs, request features, or ask questions about a skill.
      </p>

      <h3>Creating an Issue</h3>
      <ol>
        <li>Go to the skill's detail page</li>
        <li>Click the <strong>Issues</strong> tab</li>
        <li>Click <strong>New Issue</strong></li>
        <li>Add a title and description</li>
        <li>Submit the issue</li>
      </ol>

      <h3>Commenting on Issues</h3>
      <p>
        Anyone with an account can comment on open issues. Use comments to provide 
        additional context, suggest solutions, or ask follow-up questions.
      </p>

      <h3>Issue Numbering</h3>
      <p>
        Issues are numbered sequentially per skill (e.g., #1, #2, #3). This makes it 
        easy to reference specific issues in discussions.
      </p>

      <h2>Pull Requests</h2>
      <p>
        Pull requests let you propose changes to a skill's SKILL.md content. The skill 
        owner can review and merge your changes.
      </p>

      <h3>Creating a Pull Request</h3>
      <ol>
        <li>Go to the skill's detail page</li>
        <li>Click the <strong>Pull Requests</strong> tab</li>
        <li>Click <strong>New Pull Request</strong></li>
        <li>Add a title and description explaining your changes</li>
        <li>Edit the SKILL.md content with your proposed changes</li>
        <li>Submit the pull request</li>
      </ol>

      <h3>Merging Pull Requests</h3>
      <p>
        Only the skill owner can merge pull requests. When merged:
      </p>
      <ul>
        <li>The skill's SKILL.md is updated with the proposed changes</li>
        <li>A new version is automatically published with a patch bump</li>
        <li>The pull request is marked as merged</li>
      </ul>

      <div className="not-prose bg-primary/5 border border-primary/20 rounded-lg p-4 my-4">
        <p className="text-sm">
          <strong>💡 Tip:</strong> When creating a pull request, include a clear explanation 
          of what you changed and why. This helps the skill owner review your changes faster.
        </p>
      </div>

      <h2>Comments</h2>
      <p>
        Skill pages also have a general comments section (separate from issues) where users 
        can leave feedback, ask questions, or share how they're using the skill.
      </p>
    </DocsLayout>
  );
}
