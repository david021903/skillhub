import DocsLayout from "@/components/DocsLayout";

export default function PlatformVersions() {
  return (
    <DocsLayout
      title="Version Management"
      description="Publishing updates and managing releases"
    >
      <p>
        SkillHub uses semantic versioning to track changes to your skills. Every time you 
        update a skill, you publish a new version.
      </p>

      <h2>Semantic Versioning</h2>
      <p>
        Versions follow the <code>MAJOR.MINOR.PATCH</code> format:
      </p>
      <ul>
        <li><strong>MAJOR</strong> (1.x.x → 2.0.0) — Breaking changes that aren't backward compatible</li>
        <li><strong>MINOR</strong> (1.0.x → 1.1.0) — New features, backward compatible</li>
        <li><strong>PATCH</strong> (1.0.0 → 1.0.1) — Bug fixes and minor improvements</li>
      </ul>

      <h2>Publishing a New Version</h2>

      <h3>Via Web Interface</h3>
      <ol>
        <li>Go to your skill's detail page</li>
        <li>Click <strong>Publish New Version</strong></li>
        <li>Update the version number in your SKILL.md frontmatter</li>
        <li>Update the content as needed</li>
        <li>Submit the new version</li>
      </ol>

      <h3>Via CLI</h3>
      <ol>
        <li>Update the <code>version</code> field in your SKILL.md</li>
        <li>Run <code>shsc publish</code></li>
        <li>The CLI will detect the version change and publish</li>
      </ol>

      <div className="not-prose bg-muted/50 border rounded-lg p-4 my-4">
        <pre className="bg-[hsl(222,47%,8%)] text-gray-100 rounded-lg p-4 text-sm overflow-x-auto">
{`# Update version in SKILL.md, then:
shsc publish

# Output:
# ✓ Publishing my-skill v1.1.0...
# ✓ Validation passed (score: 86%)
# ✓ Published successfully!`}
        </pre>
      </div>

      <h2>Version History</h2>
      <p>
        Every published version is preserved. On the skill detail page, use the 
        <strong> version selector</strong> dropdown to:
      </p>
      <ul>
        <li>View any previous version's content</li>
        <li>Download any version as a ZIP archive</li>
        <li>Compare changes between versions</li>
      </ul>

      <h2>Version Validation</h2>
      <p>
        Each version is validated independently when published. You can see the validation 
        score and detailed results for every version. This means improving your SKILL.md 
        structure in a new version will immediately reflect in a higher score.
      </p>

      <div className="not-prose bg-primary/5 border border-primary/20 rounded-lg p-4 my-4">
        <p className="text-sm">
          <strong>💡 Tip:</strong> Always bump the version number before publishing. 
          If you try to publish with the same version number, the publish will fail.
        </p>
      </div>
    </DocsLayout>
  );
}
