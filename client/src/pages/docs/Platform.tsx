import DocsLayout from "@/components/DocsLayout";

export default function Platform() {
  return (
    <DocsLayout
      title="Browsing Skills"
      description="Discover and explore skills on the web platform"
    >
      <p>
        The SkillHub web platform at <a href="https://skillhub.space">skillhub.space</a> lets 
        you browse, search, and explore skills without needing an account. Here's how to find 
        what you're looking for.
      </p>

      <h2>Browse Page</h2>
      <p>
        Click <strong>Browse Skills</strong> in the navigation bar to see all public skills. 
        The browse page includes:
      </p>
      <ul>
        <li><strong>Search bar</strong> — Search by skill name, description, or tags</li>
        <li><strong>Sort options</strong> — Sort by latest, most stars, or most downloads</li>
        <li><strong>Skill cards</strong> — Each card shows the skill name, description, validation score, stars, and downloads</li>
      </ul>

      <h2>Skill Detail Page</h2>
      <p>Click on any skill to see its full details:</p>
      <ul>
        <li><strong>Code tab</strong> — View the SKILL.md content and browse all files</li>
        <li><strong>Issues tab</strong> — View and create issues for the skill</li>
        <li><strong>Pull Requests tab</strong> — Propose changes to the skill</li>
        <li><strong>Health badges</strong> — Validation score, version, stars, downloads, and license</li>
        <li><strong>Dependency graph</strong> — Visual display of required binaries, environment variables, and skill dependencies</li>
        <li><strong>Activity feed</strong> — Recent activity like stars, publishes, and installs</li>
        <li><strong>Version selector</strong> — View and download any published version</li>
      </ul>

      <h2>File Browser</h2>
      <p>
        Multi-file skills include a GitHub-like file browser. Click on any file to view its 
        contents, and use the breadcrumb navigation to move between directories. You can also 
        download the entire skill as a ZIP archive.
      </p>

      <h2>Validation Score Badges</h2>
      <p>
        Every skill shows a color-coded validation score badge:
      </p>
      <ul>
        <li>🟢 <strong>Green (90-100%)</strong> — Excellent quality</li>
        <li>🟡 <strong>Yellow (70-89%)</strong> — Good quality</li>
        <li>🟠 <strong>Orange (50-69%)</strong> — Needs improvement</li>
        <li>🔴 <strong>Red (below 50%)</strong> — Significant issues</li>
      </ul>

      <h2>Starring Skills</h2>
      <p>
        Click the <strong>⭐ Star</strong> button on any skill page to save it to your favorites. 
        Starred skills appear in your profile and help others discover popular skills. You need 
        to be signed in to star skills.
      </p>

      <h2>Trending Section</h2>
      <p>
        The homepage features a trending section showing skills with the highest recent activity. 
        The algorithm considers weekly downloads and recent stars to surface skills that are 
        gaining momentum.
      </p>
    </DocsLayout>
  );
}
