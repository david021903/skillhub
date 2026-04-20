import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PageIntro } from "@/components/PageIntro";
import { useToast } from "@/hooks/use-toast";
import { FileUploader } from "@/components/FileUploader";
import { usePageSeo } from "@/lib/seo";
import { skillTemplates as fallbackTemplates, type SkillTemplate } from "@/lib/skill-templates";
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
} from "@/components/ui/icons";

interface UploadedFile {
  path: string;
  content: string;
  size: number;
  isBinary: boolean;
}

type WizardStepId = "template" | "details" | "content";

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

const wizardSteps: Array<{ id: WizardStepId; label: string; title: string }> = [
  { id: "template", label: "Step 01", title: "Choose Template" },
  { id: "details", label: "Step 02", title: "Skill Details" },
  { id: "content", label: "Step 03", title: "Files & Publish" },
];

export default function CreateSkill() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  usePageSeo({
    title: "Create Skill",
    description:
      "Start a new TraderClaw skill with templates, metadata, files, and publishing controls from one creation flow.",
    canonicalPath: "/new",
    robots: "noindex,nofollow",
  });

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
  const [step, setStep] = useState<WizardStepId>("template");
  const [loadingTemplate, setLoadingTemplate] = useState(false);
  const [isPublic, setIsPublic] = useState(true);
  const [additionalFiles, setAdditionalFiles] = useState<UploadedFile[]>([]);

  const selectedTemplate = skillTemplates.find(t => t.id === selectedTemplateId) || skillTemplates[0];
  const currentStepIndex = wizardSteps.findIndex((wizardStep) => wizardStep.id === step);

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
        credentials: "include",
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
        credentials: "include",
        body: JSON.stringify({ 
          version, 
          skillMd,
          files: additionalFiles.filter(f => f.path !== "SKILL.md" && !f.isBinary).map(f => ({
            path: f.path,
            content: f.content,
          })),
        }),
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

  const handleContinueFromDetails = () => {
    if (!name.trim()) {
      toast({ title: "Error", description: "Skill name is required", variant: "destructive" });
      return;
    }

    setStep("content");
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <PageIntro
        tag="CREATE SKILL"
        title="Create A New Skill"
        description="Move step by step through template selection, setup, and publishing for a clean TraderClaw skill release."
      />

      <section className="border border-border bg-card/40 p-5 md:p-6">
        <div className="grid gap-3 md:grid-cols-3">
          {wizardSteps.map((wizardStep, index) => {
            const isActive = wizardStep.id === step;
            const isComplete = index < currentStepIndex;
            const isAccessible = index <= currentStepIndex;

            return (
              <button
                key={wizardStep.id}
                type="button"
                disabled={!isAccessible}
                onClick={() => {
                  if (isAccessible) setStep(wizardStep.id);
                }}
                className={cn(
                  "flex items-center gap-3 border px-4 py-3 text-left transition-all",
                  isActive
                    ? "border-primary/30 bg-primary/6"
                    : isComplete
                      ? "border-border/80 bg-card/30 hover:border-primary/18 hover:bg-muted/12"
                      : "border-border/60 bg-card/20",
                  !isAccessible && "cursor-default opacity-65",
                )}
              >
                <span
                  className={cn(
                    "inline-flex h-9 w-9 shrink-0 items-center justify-center border text-sm",
                    isActive || isComplete
                      ? "border-primary/30 bg-primary/8 text-primary"
                      : "border-border/70 text-muted-foreground",
                  )}
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  {isComplete ? <Check className="h-4 w-4" /> : String(index + 1).padStart(2, "0")}
                </span>
                <span className="min-w-0">
                  <span
                    className="block text-[10px] uppercase tracking-[0.18em] text-muted-foreground"
                    style={{ fontFamily: "var(--font-mono)" }}
                  >
                    {wizardStep.label}
                  </span>
                  <span className="mt-1 block text-sm text-foreground">{wizardStep.title}</span>
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <div key={step} className="animate-in fade-in-0 slide-in-from-right-2 duration-300">
        {step === "template" ? (
          <>
            {templatesLoading ? (
              <div className="space-y-6">
                <div className="animate-pulse space-y-4">
                  <div className="h-8 w-48 rounded bg-muted" />
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <div key={i} className="h-28 rounded bg-muted" />
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {templateCategories.map((category) => (
                  <div key={category} className="space-y-3">
                    <h2 className="text-lg text-foreground">{category}</h2>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {skillTemplates
                        .filter((template) => template.category === category)
                        .map((template) => {
                          const Icon = iconMap[template.icon] || FileText;
                          const isSelected = selectedTemplateId === template.id;

                          return (
                            <button
                              key={template.id}
                              type="button"
                              onClick={() => selectTemplate(template)}
                              className={cn(
                                "relative flex items-start gap-3 border p-4 text-left transition-all",
                                isSelected
                                  ? "border-primary/35 bg-primary/5"
                                  : "border-border/70 bg-card/30 hover:border-primary/20 hover:bg-muted/18",
                              )}
                            >
                              {isSelected && (
                                <span className="absolute right-3 top-3 inline-flex h-6 w-6 items-center justify-center border border-primary/30 bg-primary/8 text-primary">
                                  <Check className="h-3.5 w-3.5" />
                                </span>
                              )}
                              <div
                                className={cn(
                                  "mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center border",
                                  isSelected
                                    ? "border-primary/20 bg-primary/8 text-primary"
                                    : "border-border/70 bg-muted/18 text-muted-foreground",
                                )}
                              >
                                <Icon className="h-5 w-5" style={{ strokeWidth: 1.7 }} />
                              </div>
                              <div className="min-w-0 flex-1 pr-8">
                                <div className="font-medium text-foreground">{template.name}</div>
                                <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                                  {template.description}
                                </p>
                              </div>
                            </button>
                          );
                        })}
                    </div>
                  </div>
                ))}

                <div className="flex justify-end gap-4 pt-2">
                  <Button variant="outline" onClick={() => navigate("/")}>
                    Cancel
                  </Button>
                  <Button onClick={loadTemplateContent} disabled={loadingTemplate}>
                    {loadingTemplate ? "Loading..." : "Continue"}
                  </Button>
                </div>
              </div>
            )}
          </>
        ) : step === "details" ? (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <CardTitle>Skill Details</CardTitle>
                  <CardDescription>Template selected: {selectedTemplate.name}</CardDescription>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setStep("template")}>
                  Change Template
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
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
                <div className="grid gap-2 md:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => setIsPublic(true)}
                    className={cn(
                      "flex items-center gap-3 border p-3 text-left transition-all",
                      isPublic
                        ? "border-primary/30 bg-primary/5"
                        : "border-border/70 hover:border-primary/18 hover:bg-muted/12",
                    )}
                  >
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <div className="text-left">
                      <div className="font-medium text-sm text-foreground">Public</div>
                      <div className="text-xs text-muted-foreground">Anyone can see this skill</div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsPublic(false)}
                    className={cn(
                      "flex items-center gap-3 border p-3 text-left transition-all",
                      !isPublic
                        ? "border-primary/30 bg-primary/5"
                        : "border-border/70 hover:border-primary/18 hover:bg-muted/12",
                    )}
                  >
                    <Lock className="h-4 w-4 text-muted-foreground" />
                    <div className="text-left">
                      <div className="font-medium text-sm text-foreground">Private</div>
                      <div className="text-xs text-muted-foreground">Only you can see this skill</div>
                    </div>
                  </button>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
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

              <div className="flex justify-end gap-4 pt-2">
                <Button type="button" variant="outline" onClick={() => setStep("template")}>
                  Back
                </Button>
                <Button type="button" onClick={handleContinueFromDetails}>
                  Continue
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <CardTitle>Files And Publish</CardTitle>
                  <CardDescription>Finalize the SKILL.md content and publish your first version.</CardDescription>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setStep("details")}>
                  Edit Details
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="skillMd">SKILL.md Content *</Label>
                  <Textarea
                    id="skillMd"
                    value={skillMd}
                    onChange={(e) => setSkillMd(e.target.value)}
                    className="font-mono min-h-[320px]"
                    required
                  />
                  <p className="text-sm text-muted-foreground">
                    Use the OpenClaw SKILL.md format with YAML frontmatter.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Additional Files (Optional)</Label>
                  <p className="mb-2 text-sm text-muted-foreground">
                    Add scripts, templates, or other files that your skill needs.
                  </p>
                  <FileUploader
                    files={additionalFiles}
                    onFilesChange={setAdditionalFiles}
                    maxFiles={50}
                    maxFileSize={1024 * 1024}
                  />
                </div>

                <div className="flex justify-end gap-4">
                  <Button type="button" variant="outline" onClick={() => setStep("details")}>
                    Back
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending ? "Publishing..." : "Publish Skill"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
