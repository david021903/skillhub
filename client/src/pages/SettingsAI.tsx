import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Wand2, MessageSquare, FileText } from "lucide-react";
import SettingsLayout from "@/components/SettingsLayout";

const aiFeatures = [
  {
    icon: Wand2,
    title: "Skill Generator",
    description: "Generate complete SKILL.md files from natural language descriptions",
    status: "coming-soon" as const,
  },
  {
    icon: MessageSquare,
    title: "Skill Chat",
    description: "Chat with an AI assistant about any skill to understand its capabilities",
    status: "coming-soon" as const,
  },
  {
    icon: FileText,
    title: "Skill Explainer",
    description: "Get plain-language explanations of what a skill does and how to use it",
    status: "coming-soon" as const,
  },
];

export default function SettingsAI() {
  return (
    <SettingsLayout>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              AI Features
            </CardTitle>
            <CardDescription>
              AI-powered tools to help you create and understand skills
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {aiFeatures.map((feature) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={feature.title}
                    className="flex items-start gap-4 p-4 border rounded-lg"
                  >
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{feature.title}</h3>
                        <Badge variant="secondary" className="text-xs">
                          Coming Soon
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>About AI Features</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm dark:prose-invert max-w-none">
            <p className="text-muted-foreground">
              SkillBook's AI features are powered by Replit AI, providing intelligent assistance 
              for skill creation and discovery. All AI processing happens securely through Replit's 
              infrastructure.
            </p>
            <ul className="text-muted-foreground mt-4 space-y-2">
              <li>No additional API keys required</li>
              <li>Usage is included with your Replit account</li>
              <li>AI features are optional - all core functionality works without them</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </SettingsLayout>
  );
}
