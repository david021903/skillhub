import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Terminal, Key, Package, Loader2, RefreshCw } from "lucide-react";

interface DependencyCheckResult {
  name: string;
  type: "bin" | "env" | "skill";
  available: boolean;
  version?: string;
  message?: string;
}

interface DependencyReport {
  allSatisfied: boolean;
  results: DependencyCheckResult[];
  summary: {
    total: number;
    satisfied: number;
    missing: number;
  };
}

interface DependencyCheckerProps {
  skillMd: string;
  compact?: boolean;
}

export function DependencyChecker({ skillMd, compact = false }: DependencyCheckerProps) {
  const [report, setReport] = useState<DependencyReport | null>(null);

  const checkMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/check-dependencies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skillMd, installedSkills: [] }),
      });
      if (!res.ok) throw new Error("Failed to check dependencies");
      return res.json() as Promise<DependencyReport>;
    },
    onSuccess: (data) => setReport(data),
  });

  const getIcon = (type: string) => {
    switch (type) {
      case "bin": return <Terminal className="h-4 w-4" />;
      case "env": return <Key className="h-4 w-4" />;
      case "skill": return <Package className="h-4 w-4" />;
      default: return null;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "bin": return "Binary";
      case "env": return "Env Var";
      case "skill": return "Skill";
      default: return type;
    }
  };

  if (compact) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Dependencies</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => checkMutation.mutate()}
            disabled={checkMutation.isPending}
          >
            {checkMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </div>
        
        {report && (
          <div className="flex items-center gap-2">
            {report.allSatisfied ? (
              <Badge variant="default" className="bg-green-500">
                <CheckCircle className="h-3 w-3 mr-1" />
                All satisfied
              </Badge>
            ) : (
              <Badge variant="destructive">
                <XCircle className="h-3 w-3 mr-1" />
                {report.summary.missing} missing
              </Badge>
            )}
            <span className="text-xs text-muted-foreground">
              {report.summary.satisfied}/{report.summary.total}
            </span>
          </div>
        )}
        
        {!report && !checkMutation.isPending && (
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => checkMutation.mutate()}
          >
            Check Dependencies
          </Button>
        )}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg">Dependency Check</CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={() => checkMutation.mutate()}
          disabled={checkMutation.isPending}
        >
          {checkMutation.isPending ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Checking...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4 mr-2" />
              {report ? "Re-check" : "Check Now"}
            </>
          )}
        </Button>
      </CardHeader>
      <CardContent>
        {!report && !checkMutation.isPending && (
          <p className="text-sm text-muted-foreground">
            Click "Check Now" to verify if all required dependencies are available.
          </p>
        )}

        {report && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              {report.allSatisfied ? (
                <Badge variant="default" className="bg-green-500">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  All dependencies satisfied
                </Badge>
              ) : (
                <Badge variant="destructive">
                  <XCircle className="h-4 w-4 mr-1" />
                  {report.summary.missing} dependencies missing
                </Badge>
              )}
              <span className="text-sm text-muted-foreground">
                {report.summary.satisfied} of {report.summary.total} satisfied
              </span>
            </div>

            {report.results.length > 0 && (
              <div className="space-y-2">
                {["bin", "env", "skill"].map((type) => {
                  const items = report.results.filter((r) => r.type === type);
                  if (items.length === 0) return null;

                  return (
                    <div key={type} className="space-y-1">
                      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                        {getIcon(type)}
                        <span>{getTypeLabel(type)}s</span>
                      </div>
                      <div className="grid gap-1 pl-6">
                        {items.map((item) => (
                          <div
                            key={item.name}
                            className="flex items-center gap-2 text-sm"
                          >
                            {item.available ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-500" />
                            )}
                            <span className={item.available ? "" : "text-red-500"}>
                              {item.name}
                            </span>
                            {item.version && (
                              <span className="text-muted-foreground">
                                v{item.version}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
