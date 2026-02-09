import { useState } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles, Wand2, MessageSquare, FileText, ExternalLink, Key, Check, AlertCircle, Loader2 } from "lucide-react";
import SettingsLayout from "@/components/SettingsLayout";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

const aiFeatures = [
  {
    icon: Wand2,
    title: "Skill Generator",
    description: "Generate complete SKILL.md files from natural language descriptions",
    href: "/generate",
  },
  {
    icon: MessageSquare,
    title: "Skill Chat",
    description: "Chat with an AI assistant about any skill to understand its capabilities",
    href: "/browse",
    note: "Available on skill detail pages",
  },
  {
    icon: FileText,
    title: "Skill Explainer",
    description: "Get plain-language explanations of what a skill does and how to use it",
    href: "/browse",
    note: "Available on skill detail pages",
  },
];

export default function SettingsAI() {
  const { user, saveOpenAIKey, isSavingOpenAIKey } = useAuth();
  const { toast } = useToast();
  const [apiKey, setApiKey] = useState("");
  const [showKeyInput, setShowKeyInput] = useState(false);

  const handleSaveKey = async () => {
    if (!apiKey.trim()) {
      toast({ title: "Please enter an API key", variant: "destructive" });
      return;
    }
    if (!apiKey.startsWith("sk-")) {
      toast({ title: "Invalid API key format. OpenAI keys start with 'sk-'", variant: "destructive" });
      return;
    }
    try {
      await saveOpenAIKey(apiKey);
      toast({ title: "API key saved successfully" });
      setApiKey("");
      setShowKeyInput(false);
    } catch (error: any) {
      toast({ title: "Failed to save API key", description: error.message, variant: "destructive" });
    }
  };

  const handleRemoveKey = async () => {
    try {
      await saveOpenAIKey(null);
      toast({ title: "API key removed" });
    } catch (error: any) {
      toast({ title: "Failed to remove API key", description: error.message, variant: "destructive" });
    }
  };

  const hasKey = user?.hasOpenaiKey;

  return (
    <SettingsLayout>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              OpenAI API Key
            </CardTitle>
            <CardDescription>
              Add your own OpenAI API key to use AI features. Your key is stored securely and only used for AI features on this platform.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {hasKey ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                  <Check className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="font-medium text-green-700 dark:text-green-400">API Key Configured</p>
                    <p className="text-sm text-muted-foreground">Your OpenAI API key is saved and ready to use.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setShowKeyInput(true)}>
                    Update Key
                  </Button>
                  <Button variant="destructive" onClick={handleRemoveKey} disabled={isSavingOpenAIKey}>
                    {isSavingOpenAIKey ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Remove Key
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5" />
                  <div>
                    <p className="font-medium text-amber-700 dark:text-amber-400">No API Key</p>
                    <p className="text-sm text-muted-foreground">Add your OpenAI API key to enable AI features like Skill Generator, Explainer, and Chat.</p>
                  </div>
                </div>
                {!showKeyInput ? (
                  <Button onClick={() => setShowKeyInput(true)}>
                    <Key className="h-4 w-4 mr-2" />
                    Add API Key
                  </Button>
                ) : null}
              </div>
            )}

            {showKeyInput && (
              <div className="mt-4 space-y-4 p-4 border rounded-lg">
                <div className="space-y-2">
                  <Label htmlFor="apiKey">OpenAI API Key</Label>
                  <Input
                    id="apiKey"
                    type="password"
                    placeholder="sk-..."
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Get your API key from{" "}
                    <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                      platform.openai.com/api-keys
                    </a>
                  </p>
                </div>
                <div className="flex gap-3">
                  <Button onClick={handleSaveKey} disabled={isSavingOpenAIKey}>
                    {isSavingOpenAIKey ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Save Key
                  </Button>
                  <Button variant="ghost" onClick={() => { setShowKeyInput(false); setApiKey(""); }}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

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
                        <Badge variant={hasKey ? "default" : "secondary"} className={hasKey ? "text-xs bg-green-600" : "text-xs"}>
                          {hasKey ? "Ready" : "Needs API Key"}
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
                      <Button variant="outline" size="sm" className="gap-2" disabled={!hasKey}>
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
              ClawSkillHub uses your OpenAI API key to power AI features. This "bring your own key" approach means:
            </p>
            <ul className="text-muted-foreground mt-4 space-y-2">
              <li>You control your AI usage and costs</li>
              <li>Your API key is stored securely and never shared</li>
              <li>Rate limited to 30 requests per hour to prevent abuse</li>
              <li>Uses GPT-4 for high-quality results</li>
            </ul>
          </CardContent>
        </Card>

        {hasKey && (
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
        )}
      </div>
    </SettingsLayout>
  );
}
