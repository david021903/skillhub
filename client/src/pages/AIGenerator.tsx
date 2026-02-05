import { SkillGenerator } from "@/components/SkillGenerator";

export default function AIGenerator() {
  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">AI Skill Generator</h1>
        <p className="text-muted-foreground mt-2">
          Describe what you need and let AI create a skill for you
        </p>
      </div>
      <SkillGenerator />
    </div>
  );
}
