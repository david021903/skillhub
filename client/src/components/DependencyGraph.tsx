import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, Terminal, Key, Link2, ArrowRight } from "@/components/ui/icons";

interface Dependencies {
  skills?: string[];
  bins?: string[];
  env?: string[];
}

interface DependencyGraphProps {
  dependencies?: Dependencies | null;
  skillName: string;
}

export function DependencyGraph({ dependencies, skillName }: DependencyGraphProps) {
  if (!dependencies) return null;
  
  const hasSkills = dependencies.skills && dependencies.skills.length > 0;
  const hasBins = dependencies.bins && dependencies.bins.length > 0;
  const hasEnv = dependencies.env && dependencies.env.length > 0;
  
  if (!hasSkills && !hasBins && !hasEnv) return null;
  
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Link2 className="h-5 w-5" />
          Dependencies
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {hasSkills && (
          <div>
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
              <Package className="h-4 w-4" />
              Required Skills
            </div>
            <div className="flex flex-wrap gap-2">
              {dependencies.skills?.map((skill) => {
                const skillPath = skill.split("@")[0];
                return (
                  <a 
                    key={skill} 
                    href={`/skills/${skillPath}`}
                    className="group"
                  >
                    <Badge variant="secondary" className="gap-1 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      <ArrowRight className="h-3 w-3" />
                      {skill}
                    </Badge>
                  </a>
                );
              })}
            </div>
          </div>
        )}
        
        {hasBins && (
          <div>
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
              <Terminal className="h-4 w-4" />
              Required Binaries
            </div>
            <div className="flex flex-wrap gap-2">
              {dependencies.bins?.map((bin) => (
                <Badge key={bin} variant="outline" className="font-mono">
                  {bin}
                </Badge>
              ))}
            </div>
          </div>
        )}
        
        {hasEnv && (
          <div>
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
              <Key className="h-4 w-4" />
              Required Environment Variables
            </div>
            <div className="flex flex-wrap gap-2">
              {dependencies.env?.map((envVar) => (
                <Badge key={envVar} variant="outline" className="font-mono text-yellow-600 dark:text-yellow-400">
                  ${envVar}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
