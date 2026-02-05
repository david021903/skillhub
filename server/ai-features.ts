import OpenAI from "openai";

function getOpenAIClient(apiKey: string): OpenAI {
  return new OpenAI({
    apiKey,
  });
}

export interface ExplainerResult {
  summary: string;
  capabilities: string[];
  useCases: string[];
  requirements: string[];
  gettingStarted: string;
}

export async function explainSkill(skillMd: string, apiKey: string): Promise<ExplainerResult> {
  const openai = getOpenAIClient(apiKey);
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: `You are an expert at explaining AI agent skills. Analyze the given SKILL.md content and provide a clear, structured explanation.

Return a JSON object with:
- summary: A 2-3 sentence plain-English summary of what this skill does
- capabilities: Array of 3-5 specific things this skill can do
- useCases: Array of 2-4 practical use cases or scenarios
- requirements: Array of requirements (binaries, env vars, other skills needed)
- gettingStarted: A brief guide on how to start using this skill

Keep explanations beginner-friendly and practical.`,
      },
      {
        role: "user",
        content: `Please explain this skill:\n\n${skillMd}`,
      },
    ],
    response_format: { type: "json_object" },
    max_tokens: 1024,
  });

  const content = response.choices[0]?.message?.content || "{}";
  return JSON.parse(content) as ExplainerResult;
}

export interface GeneratorResult {
  skillMd: string;
  name: string;
  description: string;
  tags: string[];
}

export async function generateSkill(
  prompt: string,
  apiKey: string,
  options: { category?: string; complexity?: string } = {}
): Promise<GeneratorResult> {
  const openai = getOpenAIClient(apiKey);
  const systemPrompt = `You are an expert at creating OpenClaw agent skills. Generate a complete SKILL.md file based on the user's requirements.

The SKILL.md format uses YAML frontmatter followed by markdown content:

\`\`\`yaml
---
name: skill-name-lowercase
description: Brief one-line description
metadata:
  openclaw:
    requires:
      bins: []      # Required binaries (curl, python3, etc)
      env: []       # Required environment variables
      skills: []    # Required dependency skills (owner/skill-name)
---

# Skill Name

## Overview
Detailed description...

## Usage
How to use the skill...

## Examples
Example usage...
\`\`\`

Return a JSON object with:
- skillMd: The complete SKILL.md content
- name: The skill name (lowercase, kebab-case)
- description: One-line description
- tags: Array of 2-4 relevant tags`;

  const userPrompt = `Generate a skill for: ${prompt}${options.category ? `\nCategory: ${options.category}` : ""}${options.complexity ? `\nComplexity: ${options.complexity}` : ""}`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    response_format: { type: "json_object" },
    max_tokens: 2048,
  });

  const content = response.choices[0]?.message?.content || "{}";
  return JSON.parse(content) as GeneratorResult;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export async function* chatAboutSkill(
  skillMd: string,
  userMessage: string,
  apiKey: string,
  history: ChatMessage[] = []
): AsyncGenerator<string> {
  const openai = getOpenAIClient(apiKey);
  const systemPrompt = `You are an AI assistant helping users understand and use an OpenClaw agent skill. You have access to the skill's documentation below.

Answer questions about:
- What the skill does and how it works
- How to install and configure it
- Troubleshooting issues
- Best practices and tips
- Integration with other tools

Be helpful, concise, and practical.

SKILL.md content:
${skillMd}`;

  const messages: { role: "system" | "user" | "assistant"; content: string }[] = [
    { role: "system", content: systemPrompt },
    ...history.map((m) => ({ role: m.role, content: m.content })),
    { role: "user", content: userMessage },
  ];

  const stream = await openai.chat.completions.create({
    model: "gpt-4o",
    messages,
    stream: true,
    max_tokens: 1024,
  });

  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content;
    if (content) {
      yield content;
    }
  }
}
