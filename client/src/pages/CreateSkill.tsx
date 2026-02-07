import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { skillTemplates as fallbackTemplates, templateCategories as fallbackCategories, type SkillTemplate } from "@/lib/skill-templates";
import { cn } from "@/lib/utils";
import { 
  FileText, 
  Globe, 
  Plug, 
  Terminal, 
  Folder, 
  BarChart3, 
  Bell, 
  Code,
  Check,
  Lock
} from "lucide-react";

const iconMap: Record<string, typeof FileText> = {
  file: FileText,
  globe: Globe,
  plug: Plug,
  terminal: Terminal,
  folder: Folder,
  chart: BarChart3,
  bell: Bell,
  code: Code,
};

export default function CreateSkill() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: apiTemplates, isLoading: templatesLoading } = useQuery({
    queryKey: ["/api/templates"],
    queryFn: async () => {
      const res = await fetch("/api/templates");
      if (!res.ok) throw new Error("Failed to fetch templates");
      return res.json() as Promise<Omit<SkillTemplate, "skillMd">[]>;
    },
  });

  const skillTemplates: Omit<SkillTemplate, "skillMd">[] = apiTemplates || fallbackTemplates;
  const templateCategories = [...new Set(skillTemplates.map(t => t.category))];

  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("blank");
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [version, setVersion] = useState("0.1.0");
  const [skillMd, setSkillMd] = useState(fallbackTemplates[0].skillMd);
  const [step, setStep] = useState<"template" | "details">("template");
  const [loadingTemplate, setLoadingTemplate] = useState(false);
  const [isPublic, setIsPublic] = useState(true);

  const selectedTemplate = skillTemplates.find(t => t.id === selectedTemplateId) || skillTemplates[0];

  const selectTemplate = (template: Omit<SkillTemplate, "skillMd">) => {
    setSelectedTemplateId(template.id);
    setTags(template.tags.join(", "));
  };

  const loadTemplateContent = async () => {
    setLoadingTemplate(true);
    try {
      const res = await fetch(`/api/templates/${selectedTemplateId}`);
      if (res.ok) {
        const data = await res.json() as SkillTemplate;
        setSkillMd(data.skillMd);
        setTags(data.tags.join(", "));
      } else {
        const fallback = fallbackTemplates.find(t => t.id === selectedTemplateId);
        if (fallback) {
          setSkillMd(fallback.skillMd);
          setTags(fallback.tags.join(", "));
        }
      }
    } catch {
      const fallback = fallbackTemplates.find(t => t.id === selectedTemplateId);
      if (fallback) {
        setSkillMd(fallback.skillMd);
        setTags(fallback.tags.join(", "));
      }
    }
    setLoadingTemplate(false);
    setStep("details");
  };

  const createMutation = useMutation({
    mutationFn: async () => {
      const skillRes = await fetch("/api/skills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          slug: slug || name.toLowerCase().replace(/\s+/g, "-"),
          description,
          isPublic,
          tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
        }),
      });

      if (!skillRes.ok) {
        const err = await skillRes.json();
        throw new Error(err.message);
      }

      const skill = await skillRes.json();

      const versionRes = await fetch(`/api/skills/${skill.id}/versions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ version, skillMd }),
      });

      if (!versionRes.ok) {
        const err = await versionRes.json();
        throw new Error(err.message);
      }

      return skill;
    },
    onSuccess: (skill) => {
      queryClient.invalidateQueries({ queryKey: ["/api/skills"] });
      toast({ title: "Success!", description: "Your skill has been published" });
      navigate(`/my-skills`);
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast({ title: "Error", description: "Name is required", variant: "destructive" });
      return;
    }
    createMutation.mutate();
  };

  if (step === "template") {
    if (templatesLoading) {
      return (
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-48 bg-muted rounded"></div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-24 bg-muted rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Create New Skill</h1>
          <p className="text-muted-foreground mt-2">
            Choose a template to get started quickly
          </p>
        </div>

        {templateCategories.map((category) => (
          <div key={category} className="space-y-3">
            <h2 className="text-lg font-semibold">{category}</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {skillTemplates
                .filter((t) => t.category === category)
                .map((template) => {
                  const Icon = iconMap[template.icon] || FileText;
                  const isSelected = selectedTemplateId === template.id;
                  return (
                    <button
                      key={template.id}
                      onClick={() => selectTemplate(template)}
                      className={cn(
                        "flex items-start gap-3 p-4 rounded-lg border text-left transition-all",
                        isSelected
                          ? "border-primary bg-primary/5 ring-2 ring-primary"
                          : "hover:border-primary/50 hover:bg-muted/50"
                      )}
                    >
                      <div className={cn(
                        "p-2 rounded-lg",
                        isSelected ? "bg-primary text-primary-foreground" : "bg-muted"
                      )}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{template.name}</span>
                          {isSelected && <Check className="h-4 w-4 text-primary" />}
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {template.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
            </div>
          </div>
        ))}

        <div className="flex justify-end gap-4 pt-4">
          <Button variant="outline" onClick={() => navigate("/")}>
            Cancel
          </Button>
          <Button onClick={loadTemplateContent} disabled={loadingTemplate}>
            {loadingTemplate ? "Loading..." : `Continue with ${selectedTemplate?.name || "template"}`}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Create New Skill</CardTitle>
              <CardDescription>
                Using template: {selectedTemplate.name}
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setStep("template")}>
              Change Template
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Skill Name *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="My Awesome Skill"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="my-awesome-skill"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="A brief description of your skill"
              />
            </div>

            <div className="space-y-2">
              <Label>Visibility</Label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsPublic(true)}
                  className={cn(
                    "flex-1 flex items-center gap-2 p-3 rounded-lg border transition-all",
                    isPublic
                      ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                      : "border-border hover:border-muted-foreground/50"
                  )}
                >
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <div className="text-left">
                    <div className="font-medium text-sm">Public</div>
                    <div className="text-xs text-muted-foreground">Anyone can see this skill</div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setIsPublic(false)}
                  className={cn(
                    "flex-1 flex items-center gap-2 p-3 rounded-lg border transition-all",
                    !isPublic
                      ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                      : "border-border hover:border-muted-foreground/50"
                  )}
                >
                  <Lock className="h-4 w-4 text-muted-foreground" />
                  <div className="text-left">
                    <div className="font-medium text-sm">Private</div>
                    <div className="text-xs text-muted-foreground">Only you can see this skill</div>
                  </div>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="version">Initial Version</Label>
                <Input
                  id="version"
                  value={version}
                  onChange={(e) => setVersion(e.target.value)}
                  placeholder="0.1.0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tags">Tags (comma-separated)</Label>
                <Input
                  id="tags"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="automation, web, api"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="skillMd">SKILL.md Content *</Label>
              <Textarea
                id="skillMd"
                value={skillMd}
                onChange={(e) => setSkillMd(e.target.value)}
                className="font-mono min-h-[400px]"
                required
              />
              <p className="text-sm text-muted-foreground">
                Use the OpenClaw SKILL.md format with YAML frontmatter.
              </p>
            </div>

            <div className="flex justify-end gap-4">
              <Button type="button" variant="outline" onClick={() => setStep("template")}>
                Back
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Publishing..." : "Publish Skill"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
