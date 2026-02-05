import DocsLayout from "@/components/DocsLayout";

export default function Validation() {
  return (
    <DocsLayout
      title="How Validation Works"
      description="Understanding SkillHub's quality assurance system"
    >
      <p>
        Every skill published on SkillHub goes through an automatic validation pipeline. 
        This checks for quality, completeness, and security — giving each skill a score 
        that helps users identify well-written, trustworthy skills.
      </p>

      <h2>The Validation Pipeline</h2>
      <p>
        When you publish a skill (or a new version), SkillHub runs a series of automated 
        checks on your SKILL.md file. Each check either passes or fails, and the overall 
        score is calculated as a percentage of passed checks.
      </p>

      <h2>What Gets Checked</h2>
      <ol>
        <li>
          <strong>YAML Frontmatter</strong> — Is the frontmatter valid YAML? Does it parse 
          correctly between the <code>---</code> delimiters?
        </li>
        <li>
          <strong>Required Fields</strong> — Are the <code>name</code>, <code>version</code>, 
          and <code>description</code> fields present and non-empty?
        </li>
        <li>
          <strong>Semantic Versioning</strong> — Does the version follow the 
          <code>MAJOR.MINOR.PATCH</code> format?
        </li>
        <li>
          <strong>Content Quality</strong> — Is the markdown body long enough to be useful? 
          Does it contain actual instructions?
        </li>
        <li>
          <strong>Security Check</strong> — Scans for suspicious patterns like hardcoded 
          credentials, API keys, or potentially dangerous commands
        </li>
        <li>
          <strong>Permissions Declaration</strong> — Does the skill declare what permissions 
          it needs (network, filesystem, subprocess)?
        </li>
        <li>
          <strong>OpenClaw Metadata</strong> — Is the <code>metadata.openclaw</code> section 
          present with proper <code>requires</code> fields?
        </li>
      </ol>

      <h2>Score Calculation</h2>
      <p>
        The validation score is simply: <code>(passed checks / total checks) × 100</code>
      </p>
      <p>
        For example, if a skill passes 5 out of 7 checks, it scores 71%.
      </p>

      <h2>Score Display</h2>
      <p>
        Validation scores appear as color-coded badges throughout the platform:
      </p>
      <ul>
        <li>🟢 <strong>90-100%</strong> — Excellent, fully compliant</li>
        <li>🟡 <strong>70-89%</strong> — Good, minor improvements possible</li>
        <li>🟠 <strong>50-69%</strong> — Needs improvement</li>
        <li>🔴 <strong>Below 50%</strong> — Significant issues to address</li>
      </ul>

      <h2>Per-Version Scoring</h2>
      <p>
        Each version of a skill is validated independently. This means publishing a new 
        version with improvements will immediately show a higher score, without affecting 
        previous versions' scores.
      </p>
    </DocsLayout>
  );
}
