import DocsLayout from "@/components/DocsLayout";

export default function AIGenerator() {
  return (
    <DocsLayout
      title="Skill Generator"
      description="Create skills from natural language descriptions"
    >
      <p>
        The Skill Generator creates a complete SKILL.md file from a plain-English description 
        of what you want your skill to do. It handles the formatting, frontmatter structure, 
        and instruction writing for you.
      </p>

      <h2>How to Use It</h2>
      <ol>
        <li>Sign in to SkillHub</li>
        <li>Navigate to the <strong>AI Generator</strong> page (found in the sidebar)</li>
        <li>Describe what you want your skill to do in plain English</li>
        <li>Click <strong>Generate</strong></li>
        <li>Review the generated SKILL.md</li>
        <li>Edit as needed and publish</li>
      </ol>

      <h2>Writing Good Prompts</h2>
      <p>
        The quality of the generated skill depends on your description. Here are some tips:
      </p>

      <h3>Be Specific</h3>
      <div className="not-prose flex gap-4 my-4">
        <div className="flex-1 bg-green-500/5 border border-green-500/20 rounded-lg p-4">
          <div className="text-sm font-medium text-green-600 mb-2">✅ Good</div>
          <p className="text-sm">"Create a skill that helps the agent analyze CSV files, find 
          data patterns, and generate summary statistics including mean, median, and 
          standard deviation for numeric columns."</p>
        </div>
        <div className="flex-1 bg-red-500/5 border border-red-500/20 rounded-lg p-4">
          <div className="text-sm font-medium text-red-600 mb-2">❌ Vague</div>
          <p className="text-sm">"Make a data skill."</p>
        </div>
      </div>

      <h3>Mention Dependencies</h3>
      <p>
        If your skill needs specific tools, mention them:
      </p>
      <p className="text-sm italic text-muted-foreground">
        "Create a skill that uses Python and pandas to analyze CSV data..."
      </p>

      <h3>Describe the Output</h3>
      <p>
        Tell the generator what the skill should produce:
      </p>
      <p className="text-sm italic text-muted-foreground">
        "...and output a formatted markdown table with the results."
      </p>

      <h2>After Generating</h2>
      <p>
        The generated SKILL.md is a starting point. You should:
      </p>
      <ol>
        <li><strong>Review</strong> — Make sure the instructions are accurate and complete</li>
        <li><strong>Edit</strong> — Customize for your specific use case</li>
        <li><strong>Validate</strong> — Run validation to check the score</li>
        <li><strong>Publish</strong> — When satisfied, publish to SkillHub</li>
      </ol>
    </DocsLayout>
  );
}
