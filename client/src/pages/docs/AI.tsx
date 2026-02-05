import DocsLayout from "@/components/DocsLayout";

export default function AI() {
  return (
    <DocsLayout
      title="AI Features Overview"
      description="AI-powered tools to help you create and understand skills"
    >
      <p>
        SkillHub includes AI-powered features that help you understand existing skills, 
        generate new ones, and get answers about how skills work. These features use 
        OpenAI's language models.
      </p>

      <h2>Available AI Features</h2>
      <ul>
        <li>
          <strong>Skill Explainer</strong> — Get a plain-English explanation of any skill's 
          purpose, capabilities, and use cases
        </li>
        <li>
          <strong>Skill Generator</strong> — Create a complete SKILL.md from a natural 
          language description of what you want
        </li>
        <li>
          <strong>Skill Chat</strong> — Ask questions about any skill and get streaming 
          answers
        </li>
      </ul>

      <h2>Setup: Bring Your Own Key (BYOK)</h2>
      <p>
        AI features use a "bring your own key" model — you provide your own OpenAI API 
        key, and the features use your key for requests.
      </p>
      <ol>
        <li>Get an API key from <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener">OpenAI's dashboard</a></li>
        <li>Sign in to SkillHub</li>
        <li>Go to <strong>Settings → AI</strong></li>
        <li>Enter your OpenAI API key</li>
        <li>Click <strong>Save</strong></li>
      </ol>

      <div className="not-prose bg-primary/5 border border-primary/20 rounded-lg p-4 my-4">
        <p className="text-sm">
          <strong>💡 How it works:</strong> Your API key is stored securely and encrypted 
          in the database. It's only used when you explicitly trigger an AI feature, and 
          all API calls are made server-side — your key is never exposed to the browser.
        </p>
      </div>

      <h2>Rate Limits</h2>
      <p>
        To prevent abuse, AI endpoints are rate-limited to <strong>30 requests per hour</strong> per 
        user. This is plenty for normal usage.
      </p>

      <h2>Cost</h2>
      <p>
        Since you're using your own OpenAI key, you're billed directly by OpenAI based on 
        your usage. Each AI feature typically uses a small amount of tokens:
      </p>
      <ul>
        <li><strong>Explainer</strong> — ~500-1,000 tokens per explanation</li>
        <li><strong>Generator</strong> — ~1,000-2,000 tokens per generated skill</li>
        <li><strong>Chat</strong> — Varies by conversation length</li>
      </ul>
    </DocsLayout>
  );
}
