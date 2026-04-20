import { SkillGenerator } from "@/components/SkillGenerator";
import { PageIntro } from "@/components/PageIntro";
import { usePageSeo } from "@/lib/seo";

export default function AIGenerator() {
  usePageSeo({
    title: "AI Skill Generator",
    description:
      "Generate TraderClaw skill drafts from natural-language prompts and turn ideas into structured SKILL.md files faster.",
    canonicalPath: "/generate",
    robots: "noindex,nofollow",
  });

  return (
    <div className="max-w-6xl space-y-8">
      <PageIntro
        tag="AI GENERATOR"
        title="Generate A TraderClaw Skill"
        description="Move from idea to generated draft, refine the content, and publish the final skill into My Skills step by step."
      />
      <SkillGenerator />
    </div>
  );
}
