import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Wand2, Copy, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface GeneratorResult {
  skillMd: string;
  name: string;
  description: string;
  tags: string[];
}

interface SkillGeneratorProps {
  onGenerated?: (result: GeneratorResult) => void;
}

export function SkillGenerator({ onGenerated }: SkillGeneratorProps) {
  const { toast } = useToast();
  const [prompt, setPrompt] = useState("");
  const [category, setCategory] = useState("");
  const [complexity, setComplexity] = useState("");
  const [result, setResult] = useState<GeneratorResult | null>(null);
  const [copied, setCopied] = useState(false);

  const generateMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/skills/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ prompt, category, complexity }),
      });
      if (!res.ok) {
        if (res.status === 401) throw new Error("Please sign in to generate skills");
        throw new Error("Failed to generate skill");
      }
      return res.json() as Promise<GeneratorResult>;
    },
    onSuccess: (data) => {
      setResult(data);
      onGenerated?.(data);
      toast({
        title: "Skill Generated",
        description: `Created "${data.name}" skill`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const copyToClipboard = async () => {
    if (result) {
      await navigator.clipboard.writeText(result.skillMd);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wand2 className="h-5 w-5 text-primary" />
            AI Skill Generator
          </CardTitle>
          <CardDescription>
            Describe what you want your skill to do and let AI generate the SKILL.md
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="prompt">What should your skill do?</Label>
            <Textarea
              id="prompt"
              placeholder="Example: A skill that helps agents scrape product prices from e-commerce websites..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={3}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Category (optional)</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="web-scraping">Web Scraping</SelectItem>
                  <SelectItem value="api-integration">API Integration</SelectItem>
                  <SelectItem value="cli-tool">CLI Tool</SelectItem>
                  <SelectItem value="file-processing">File Processing</SelectItem>
                  <SelectItem value="data-analysis">Data Analysis</SelectItem>
                  <SelectItem value="automation">Automation</SelectItem>
                  <SelectItem value="code-generation">Code Generation</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Complexity (optional)</Label>
              <Select value={complexity} onValueChange={setComplexity}>
                <SelectTrigger>
                  <SelectValue placeholder="Select complexity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="simple">Simple</SelectItem>
                  <SelectItem value="moderate">Moderate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button
            onClick={() => generateMutation.mutate()}
            disabled={!prompt.trim() || generateMutation.isPending}
            className="w-full"
          >
            {generateMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Wand2 className="h-4 w-4 mr-2" />
                Generate Skill
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{result.name}</CardTitle>
                <CardDescription>{result.description}</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={copyToClipboard}>
                {copied ? (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </>
                )}
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {result.tags.map((tag, i) => (
                <Badge key={i} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted rounded-lg p-4 overflow-x-auto text-sm max-h-96">
              <code>{result.skillMd}</code>
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
