import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Sparkles, 
  FileText,
  Shield,
  Settings2,
  Layers
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ValidationCheck {
  id: string;
  category: string;
  status: "passed" | "failed" | "warning" | "skipped";
  message?: string;
}

interface ValidationResult {
  passed: boolean;
  score: number;
  checks: ValidationCheck[];
}

const sampleSkillMd = `---
name: example-skill
description: An example skill for demonstration
metadata:
  openclaw:
    requires:
      bins: []
      env: []
---

# Example Skill

This is an example skill that demonstrates the SKILL.md format.

## Usage

Explain how to use this skill here.

## Permissions

This skill requires no special permissions.
`;

const categoryIcons: Record<string, typeof FileText> = {
  manifest: FileText,
  skillmd: Layers,
  security: Shield,
  compat: Settings2,
};

const categoryLabels: Record<string, string> = {
  manifest: "Manifest",
  skillmd: "Content",
  security: "Security",
  compat: "Compatibility",
};

export default function Validate() {
  const { toast } = useToast();
  const [skillMd, setSkillMd] = useState("");
  const [result, setResult] = useState<ValidationResult | null>(null);

  const validateMutation = useMutation({
    mutationFn: async (content: string) => {
      const res = await fetch("/api/cli/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skillMd: content }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message);
      }
      return res.json() as Promise<ValidationResult>;
    },
    onSuccess: (data) => {
      setResult(data);
      if (data.passed) {
        toast({ title: "Validation passed!", description: `Score: ${data.score}%` });
      } else {
        toast({ 
          title: "Validation failed", 
          description: "Please fix the issues below",
          variant: "destructive" 
        });
      }
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleValidate = () => {
    if (!skillMd.trim()) {
      toast({ title: "Error", description: "Please enter SKILL.md content", variant: "destructive" });
      return;
    }
    validateMutation.mutate(skillMd);
  };

  const loadExample = () => {
    setSkillMd(sampleSkillMd);
    setResult(null);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "passed":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default:
        return null;
    }
  };

  const groupedChecks = result?.checks.reduce((acc, check) => {
    if (!acc[check.category]) {
      acc[check.category] = [];
    }
    acc[check.category].push(check);
    return acc;
  }, {} as Record<string, ValidationCheck[]>);

  const passedCount = result?.checks.filter(c => c.status === "passed").length || 0;
  const failedCount = result?.checks.filter(c => c.status === "failed").length || 0;
  const warningCount = result?.checks.filter(c => c.status === "warning").length || 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Sparkles className="h-8 w-8" />
          Validate SKILL.md
        </h1>
        <p className="text-muted-foreground mt-2">
          Check your skill for errors, security issues, and best practices before publishing
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>SKILL.md Content</CardTitle>
              <Button variant="outline" size="sm" onClick={loadExample}>
                Load Example
              </Button>
            </div>
            <CardDescription>
              Paste your SKILL.md content with YAML frontmatter
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={skillMd}
              onChange={(e) => {
                setSkillMd(e.target.value);
                setResult(null);
              }}
              placeholder={`---
name: my-skill
description: A helpful skill
---

# My Skill

...`}
              className="font-mono text-sm min-h-[400px]"
            />
            <Button 
              onClick={handleValidate} 
              disabled={validateMutation.isPending || !skillMd.trim()}
              className="w-full"
            >
              {validateMutation.isPending ? "Validating..." : "Validate"}
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {result && (
            <>
              <Card className={cn(
                "border-2",
                result.passed ? "border-green-500" : "border-red-500"
              )}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {result.passed ? (
                        <CheckCircle2 className="h-10 w-10 text-green-500" />
                      ) : (
                        <XCircle className="h-10 w-10 text-red-500" />
                      )}
                      <div>
                        <h3 className="text-xl font-bold">
                          {result.passed ? "Validation Passed" : "Validation Failed"}
                        </h3>
                        <p className="text-muted-foreground">
                          Score: {result.score}%
                        </p>
                      </div>
                    </div>
                    <div className="text-right space-y-1">
                      <div className="flex gap-2 justify-end">
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          {passedCount} passed
                        </Badge>
                        {failedCount > 0 && (
                          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                            {failedCount} failed
                          </Badge>
                        )}
                        {warningCount > 0 && (
                          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                            {warningCount} warnings
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {groupedChecks && Object.entries(groupedChecks).map(([category, checks]) => {
                const Icon = categoryIcons[category] || FileText;
                const label = categoryLabels[category] || category;
                const hasFailed = checks.some(c => c.status === "failed");
                const hasWarning = checks.some(c => c.status === "warning");
                
                return (
                  <Card key={category}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        {label}
                        {hasFailed && (
                          <Badge variant="destructive" className="text-xs">
                            Issues
                          </Badge>
                        )}
                        {!hasFailed && hasWarning && (
                          <Badge variant="secondary" className="text-xs">
                            Warnings
                          </Badge>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {checks.map((check) => (
                        <div
                          key={check.id}
                          className={cn(
                            "flex items-start gap-2 p-2 rounded-md text-sm",
                            check.status === "failed" && "bg-red-50 dark:bg-red-950/20",
                            check.status === "warning" && "bg-yellow-50 dark:bg-yellow-950/20",
                            check.status === "passed" && "bg-green-50 dark:bg-green-950/20"
                          )}
                        >
                          {getStatusIcon(check.status)}
                          <span>{check.message}</span>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                );
              })}
            </>
          )}

          {!result && (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center text-muted-foreground">
                <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Enter your SKILL.md content and click Validate</p>
                <p className="text-sm mt-2">
                  We'll check for errors, security issues, and best practices
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
