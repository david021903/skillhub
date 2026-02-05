import DocsLayout from "@/components/DocsLayout";

export default function AIChat() {
  return (
    <DocsLayout
      title="Skill Chat"
      description="Ask questions about any skill"
    >
      <p>
        Skill Chat lets you have a conversation about a specific skill. Ask questions 
        about how it works, what it can do, or how to use it — and get streaming answers 
        based on the skill's SKILL.md content.
      </p>

      <h2>How to Use It</h2>
      <ol>
        <li>Go to any skill's detail page</li>
        <li>Find the <strong>Chat</strong> section</li>
        <li>Type your question in the input field</li>
        <li>Press Enter or click Send</li>
        <li>Watch the answer stream in real-time</li>
      </ol>

      <h2>Example Questions</h2>
      <ul>
        <li>"What does this skill do?"</li>
        <li>"How do I use this with Python?"</li>
        <li>"What dependencies do I need to install?"</li>
        <li>"Can this skill handle multiple files at once?"</li>
        <li>"What's the difference between this and the json-parser skill?"</li>
      </ul>

      <h2>How It Works</h2>
      <p>
        The chat feature sends the skill's SKILL.md content along with your question to 
        the AI model. This means the AI has full context about the skill when answering, 
        so its responses are grounded in the actual skill documentation.
      </p>

      <h2>Streaming Responses</h2>
      <p>
        Answers stream in real-time using Server-Sent Events (SSE). You'll see the response 
        appear word by word, similar to ChatGPT. This provides a faster, more interactive 
        experience compared to waiting for the full response.
      </p>

      <div className="not-prose bg-primary/5 border border-primary/20 rounded-lg p-4 my-4">
        <p className="text-sm">
          <strong>💡 Tip:</strong> Ask specific, focused questions for the best answers. 
          Instead of "tell me everything about this skill," try "what are the required 
          environment variables and how do I set them up?"
        </p>
      </div>
    </DocsLayout>
  );
}
