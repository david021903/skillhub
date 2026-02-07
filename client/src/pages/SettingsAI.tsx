import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkles, Wand2, MessageSquare, FileText, ExternalLink } from "lucide-react";
import SettingsLayout from "@/components/SettingsLayout";

const aiFeatures = [
  {
    icon: Wand2,
    title: "Skill Generator",
    description: "Generate complete SKILL.md files from natural language descriptions",
    status: "active" as const,
    href: "/generate",
  },
  {
    icon: MessageSquare,
    title: "Skill Chat",
    description: "Chat with an AI assistant about any skill to understand its capabilities",
    status: "active" as const,
    href: "/browse",
    note: "Available on skill detail pages",
  },
  {
    icon: FileText,
    title: "Skill Explainer",
    description: "Get plain-language explanations of what a skill does and how to use it",
    status: "active" as const,
    href: "/browse",
    note: "Available on skill detail pages",
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
                        <Badge variant="default" className="text-xs bg-green-600">
                          Active
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {feature.description}
                      </p>
                      {feature.note && (
                        <p className="text-xs text-muted-foreground mt-1 italic">
                          {feature.note}
                        </p>
                      )}
                    </div>
                    <Link href={feature.href}>
                      <Button variant="outline" size="sm" className="gap-2">
                        <ExternalLink className="h-3 w-3" />
                        Try it
                      </Button>
                    </Link>
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
              ClawSkillHub's AI features are powered by Replit AI, providing intelligent assistance 
              for skill creation and discovery. All AI processing happens securely through Replit's 
              infrastructure.
            </p>
            <ul className="text-muted-foreground mt-4 space-y-2">
              <li>No additional API keys required</li>
              <li>Usage is included with your Replit account</li>
              <li>Rate limited to 30 requests per hour to prevent abuse</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Access</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Link href="/generate">
                <Button className="gap-2">
                  <Wand2 className="h-4 w-4" />
                  Open AI Generator
                </Button>
              </Link>
              <Link href="/browse">
                <Button variant="outline" className="gap-2">
                  <FileText className="h-4 w-4" />
                  Browse Skills (for Explainer & Chat)
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </SettingsLayout>
  );
}
