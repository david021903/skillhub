import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles, BookOpen, Target, CheckCircle, Rocket } from "lucide-react";

interface ExplainerResult {
  summary: string;
  capabilities: string[];
  useCases: string[];
  requirements: string[];
  gettingStarted: string;
}

interface SkillExplainerProps {
  skillMd: string;
}

export function SkillExplainer({ skillMd }: SkillExplainerProps) {
  const [explanation, setExplanation] = useState<ExplainerResult | null>(null);

  const explainMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/skills/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skillMd }),
      });
      if (!res.ok) throw new Error("Failed to explain skill");
      return res.json() as Promise<ExplainerResult>;
    },
    onSuccess: (data) => setExplanation(data),
  });

  if (!explanation && !explainMutation.isPending) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <Sparkles className="h-12 w-12 mx-auto text-primary/50 mb-4" />
            <h3 className="font-semibold text-lg mb-2">AI Skill Explainer</h3>
            <p className="text-muted-foreground mb-4">
              Get a plain-English explanation of what this skill does
            </p>
            <Button onClick={() => explainMutation.mutate()}>
              <Sparkles className="h-4 w-4 mr-2" />
              Explain This Skill
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (explainMutation.isPending) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Analyzing skill...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!explanation) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          AI Explanation
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h4 className="font-medium flex items-center gap-2 mb-2">
            <BookOpen className="h-4 w-4" />
            Summary
          </h4>
          <p className="text-muted-foreground">{explanation.summary}</p>
        </div>

        <div>
          <h4 className="font-medium flex items-center gap-2 mb-2">
            <CheckCircle className="h-4 w-4" />
            Capabilities
          </h4>
          <ul className="space-y-1">
            {explanation.capabilities.map((cap, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <span className="text-primary mt-1">•</span>
                <span>{cap}</span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="font-medium flex items-center gap-2 mb-2">
            <Target className="h-4 w-4" />
            Use Cases
          </h4>
          <div className="flex flex-wrap gap-2">
            {explanation.useCases.map((useCase, i) => (
              <Badge key={i} variant="secondary">
                {useCase}
              </Badge>
            ))}
          </div>
        </div>

        {explanation.requirements.length > 0 && (
          <div>
            <h4 className="font-medium mb-2">Requirements</h4>
            <div className="flex flex-wrap gap-2">
              {explanation.requirements.map((req, i) => (
                <Badge key={i} variant="outline">
                  {req}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <div>
          <h4 className="font-medium flex items-center gap-2 mb-2">
            <Rocket className="h-4 w-4" />
            Getting Started
          </h4>
          <p className="text-sm text-muted-foreground">{explanation.gettingStarted}</p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => explainMutation.mutate()}
          disabled={explainMutation.isPending}
        >
          Regenerate Explanation
        </Button>
      </CardContent>
    </Card>
  );
}
