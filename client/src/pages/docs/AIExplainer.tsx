import DocsLayout from "@/components/DocsLayout";

export default function AIExplainer() {
  return (
    <DocsLayout
      title="Skill Explainer"
      description="Get AI-powered explanations of any skill"
    >
      <p>
        The Skill Explainer uses AI to analyze a SKILL.md file and generate a clear, 
        structured explanation of what the skill does, how it works, and when to use it.
      </p>

      <h2>How to Use It</h2>
      <ol>
        <li>Go to any skill's detail page</li>
        <li>Look for the <strong>AI Explain</strong> button</li>
        <li>Click it to generate an explanation</li>
      </ol>

      <h2>What You Get</h2>
      <p>The explainer provides:</p>
      <ul>
        <li><strong>Summary</strong> — A 2-3 sentence plain-English summary of the skill</li>
        <li><strong>Capabilities</strong> — 3-5 specific things the skill can do</li>
        <li><strong>Use Cases</strong> — Practical scenarios where this skill is useful</li>
        <li><strong>Requirements</strong> — What you need to have installed</li>
        <li><strong>Getting Started</strong> — A brief guide on how to start using the skill</li>
      </ul>

      <h2>When It's Helpful</h2>
      <ul>
        <li>When a skill's documentation is technical and hard to understand</li>
        <li>When you want a quick overview before deciding to install a skill</li>
        <li>When you're comparing similar skills and need quick summaries</li>
      </ul>

      <div className="not-prose bg-primary/5 border border-primary/20 rounded-lg p-4 my-4">
        <p className="text-sm">
          <strong>💡 Tip:</strong> The explainer works best with skills that have detailed 
          SKILL.md content. For very short or minimal skills, the explanation will also 
          be brief.
        </p>
      </div>
    </DocsLayout>
  );
}
