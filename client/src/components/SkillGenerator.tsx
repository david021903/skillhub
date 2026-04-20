import { useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileUploader } from "@/components/FileUploader";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Check, Copy, Globe, Key, Loader2, Lock } from "@/components/ui/icons";

interface GeneratorResult {
  skillMd: string;
  name: string;
  description: string;
  tags: string[];
}

interface UploadedFile {
  path: string;
  content: string;
  size: number;
  isBinary: boolean;
}

interface SkillGeneratorProps {
  onGenerated?: (result: GeneratorResult) => void;
}

type GeneratorStepId = "brief" | "draft" | "setup" | "review";

const generatorSteps: Array<{ id: GeneratorStepId; label: string; title: string }> = [
  { id: "brief", label: "Step 01", title: "Skill Brief" },
  { id: "draft", label: "Step 02", title: "Generated Draft" },
  { id: "setup", label: "Step 03", title: "Publish Setup" },
  { id: "review", label: "Step 04", title: "Review & Publish" },
];

function toSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

function normalizeTags(value: string) {
  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

export function SkillGenerator({ onGenerated }: SkillGeneratorProps) {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [step, setStep] = useState<GeneratorStepId>("brief");
  const [prompt, setPrompt] = useState("");
  const [category, setCategory] = useState("");
  const [complexity, setComplexity] = useState("");
  const [result, setResult] = useState<GeneratorResult | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [skillMd, setSkillMd] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [version, setVersion] = useState("0.1.0");
  const [isPublic, setIsPublic] = useState(true);
  const [additionalFiles, setAdditionalFiles] = useState<UploadedFile[]>([]);
  const [copied, setCopied] = useState(false);
  const [needsApiKey, setNeedsApiKey] = useState(false);

  const currentStepIndex = generatorSteps.findIndex((wizardStep) => wizardStep.id === step);
  const generatedTags = useMemo(() => normalizeTags(tags), [tags]);
  const previewLines = useMemo(() => skillMd.trim().split("\n").slice(0, 18).join("\n"), [skillMd]);

  useEffect(() => {
    if (!slugTouched) {
      setSlug(toSlug(name));
    }
  }, [name, slugTouched]);

  const generateMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/skills/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ prompt, category, complexity }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (res.status === 400 && data.message?.toLowerCase().includes("api key")) {
          setNeedsApiKey(true);
          throw new Error(data.message);
        }
        if (res.status === 401) throw new Error("Please sign in to generate skills");
        throw new Error(data.message || "Failed to generate skill");
      }
      setNeedsApiKey(false);
      return res.json() as Promise<GeneratorResult>;
    },
    onSuccess: (data) => {
      setResult(data);
      setName(data.name);
      setDescription(data.description);
      setTags(data.tags.join(", "));
      setSkillMd(data.skillMd);
      setSlugTouched(false);
      setSlug(toSlug(data.name));
      setStep("draft");
      onGenerated?.(data);
      toast({
        title: "Draft ready",
        description: `Generated a draft for "${data.name}".`,
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

  const publishMutation = useMutation({
    mutationFn: async () => {
      const normalizedSlug = slug || toSlug(name);
      const skillRes = await fetch("/api/skills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name,
          slug: normalizedSlug,
          description,
          isPublic,
          tags: generatedTags,
        }),
      });

      if (!skillRes.ok) {
        const err = await skillRes.json().catch(() => ({}));
        throw new Error(err.message || "Failed to create skill");
      }

      const skill = await skillRes.json();

      const versionRes = await fetch(`/api/skills/${skill.id}/versions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          version,
          skillMd,
          files: additionalFiles
            .filter((file) => file.path !== "SKILL.md" && !file.isBinary)
            .map((file) => ({
              path: file.path,
              content: file.content,
            })),
        }),
      });

      if (!versionRes.ok) {
        const err = await versionRes.json().catch(() => ({}));
        throw new Error(err.message || "Failed to publish generated skill");
      }

      return skill;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/skills"] });
      queryClient.invalidateQueries({ queryKey: ["/api/my-skills"] });
      toast({
        title: "Skill published",
        description: "Your generated skill is now available in My Skills.",
      });
      navigate("/my-skills");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const copyDraft = async () => {
    await navigator.clipboard.writeText(skillMd);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleGenerate = () => {
    if (!prompt.trim()) {
      toast({
        title: "Prompt required",
        description: "Add a short brief so the AI can generate a useful skill draft.",
        variant: "destructive",
      });
      return;
    }

    generateMutation.mutate();
  };

  const handleContinueFromDraft = () => {
    if (!name.trim()) {
      toast({ title: "Name required", description: "Add a skill name before continuing.", variant: "destructive" });
      return;
    }

    if (!skillMd.trim()) {
      toast({ title: "SKILL.md required", description: "The generated draft needs content before you continue.", variant: "destructive" });
      return;
    }

    setStep("setup");
  };

  const handleContinueFromSetup = () => {
    if (!version.trim()) {
      toast({ title: "Version required", description: "Add an initial version before review.", variant: "destructive" });
      return;
    }

    if (!slug.trim()) {
      setSlug(toSlug(name));
    }

    setStep("review");
  };

  return (
    <div className="space-y-8">
      <section className="sticky top-0 z-20 border border-border bg-background/92 p-4 shadow-[0_1px_0_0_hsl(var(--border))] backdrop-blur-sm sm:p-5 md:p-6">
        <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-4">
          {generatorSteps.map((wizardStep, index) => {
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
                  "flex min-h-[4.5rem] items-center gap-3 border px-4 py-3 text-left transition-all",
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
        {step === "brief" ? (
          <Card className="border-border bg-card/40">
            <CardHeader>
              <CardTitle>Describe The Skill</CardTitle>
              <CardDescription>
                Start with a short brief. The generator will create a structured draft you can refine before publishing it to My Skills.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="prompt">What should this skill do?</Label>
                <Textarea
                  id="prompt"
                  placeholder="Example: A skill that helps agents monitor market structure, summarize key shifts, and flag notable setup changes."
                  value={prompt}
                  onChange={(event) => setPrompt(event.target.value)}
                  rows={5}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="automation">Automation</SelectItem>
                      <SelectItem value="research">Research</SelectItem>
                      <SelectItem value="trading">Trading</SelectItem>
                      <SelectItem value="analysis">Analysis</SelectItem>
                      <SelectItem value="code-generation">Code Generation</SelectItem>
                      <SelectItem value="cli-tool">CLI Tool</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Complexity</Label>
                  <Select value={complexity} onValueChange={setComplexity}>
                    <SelectTrigger className="h-12">
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

              {needsApiKey && (
                <div className="flex items-center gap-2 border border-amber-500/25 bg-amber-500/8 px-4 py-3 text-sm text-muted-foreground">
                  <Key className="h-4 w-4 shrink-0 text-amber-500" />
                  <span>
                    Add your OpenAI API key in{" "}
                    <Link href="/settings/ai">
                      <span className="cursor-pointer underline hover:text-primary">Settings → AI</span>
                    </Link>{" "}
                    to use the generator.
                  </span>
                </div>
              )}

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <Button variant="outline" onClick={() => navigate("/")}>
                  Cancel
                </Button>
                <Button onClick={handleGenerate} disabled={generateMutation.isPending || !prompt.trim()}>
                  {generateMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating Draft...
                    </>
                  ) : (
                    "Generate Draft"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : step === "draft" ? (
          <Card className="border-border bg-card/40">
            <CardHeader>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <CardTitle>Refine The Generated Draft</CardTitle>
                  <CardDescription>
                    Edit the name, summary, tags, and SKILL.md content before you move on to publish setup.
                  </CardDescription>
                </div>
                <Button variant="outline" className="w-full sm:w-auto" onClick={copyDraft}>
                  {copied ? (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="mr-2 h-4 w-4" />
                      Copy Draft
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="generated-name">Skill Name</Label>
                  <Input
                    id="generated-name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Skill name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="generated-tags">Tags</Label>
                  <Input
                    id="generated-tags"
                    value={tags}
                    onChange={(event) => setTags(event.target.value)}
                    placeholder="trading, structure, alerts"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="generated-description">Description</Label>
                <Textarea
                  id="generated-description"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  rows={3}
                  placeholder="Short registry description"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="generated-skill-md">SKILL.md</Label>
                <Textarea
                  id="generated-skill-md"
                  value={skillMd}
                  onChange={(event) => setSkillMd(event.target.value)}
                  className="min-h-[360px] font-mono text-sm"
                />
                <p className="text-sm text-muted-foreground">
                  This is the generated draft. You can edit it freely before it becomes a published skill.
                </p>
              </div>

              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button variant="outline" onClick={() => setStep("brief")}>
                    Back
                  </Button>
                  <Button variant="outline" onClick={handleGenerate} disabled={generateMutation.isPending}>
                    {generateMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Regenerating...
                      </>
                    ) : (
                      "Regenerate"
                    )}
                  </Button>
                </div>
                <Button className="w-full sm:w-auto lg:min-w-[9rem]" onClick={handleContinueFromDraft}>Continue</Button>
              </div>
            </CardContent>
          </Card>
        ) : step === "setup" ? (
          <Card className="border-border bg-card/40">
            <CardHeader>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <CardTitle>Prepare The Publish Setup</CardTitle>
                  <CardDescription>
                    Choose how the generated draft should be saved, versioned, and published into My Skills.
                  </CardDescription>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setStep("draft")}>
                  Edit Draft
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="skill-slug">Slug</Label>
                  <Input
                    id="skill-slug"
                    value={slug}
                    onChange={(event) => {
                      setSlugTouched(true);
                      setSlug(event.target.value);
                    }}
                    placeholder="skill-slug"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="skill-version">Initial Version</Label>
                  <Input
                    id="skill-version"
                    value={version}
                    onChange={(event) => setVersion(event.target.value)}
                    placeholder="0.1.0"
                  />
                </div>
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
                      <div className="text-xs text-muted-foreground">Visible in the registry after publishing</div>
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
                      <div className="text-xs text-muted-foreground">Saved to My Skills without public exposure</div>
                    </div>
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Additional Files</Label>
                <p className="text-sm text-muted-foreground">
                  Add scripts, templates, or assets that should ship with this generated skill.
                </p>
                <FileUploader
                  files={additionalFiles}
                  onFilesChange={setAdditionalFiles}
                  maxFiles={50}
                  maxFileSize={1024 * 1024}
                />
              </div>

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <Button variant="outline" onClick={() => setStep("draft")}>
                  Back
                </Button>
                <Button onClick={handleContinueFromSetup}>Continue</Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-border bg-card/40">
            <CardHeader>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <CardTitle>Review The Submission</CardTitle>
                  <CardDescription>
                    Final check before publishing. This will create the skill, publish version {version}, and place it in My Skills.
                  </CardDescription>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setStep("setup")}>
                  Edit Setup
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 lg:grid-cols-2">
                <section className="space-y-4 border border-border/70 bg-background/35 p-5">
                  <div>
                    <div
                      className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground"
                      style={{ fontFamily: "var(--font-mono)" }}
                    >
                      Skill Overview
                    </div>
                    <h3 className="mt-2 text-xl text-foreground">{name || "Untitled Skill"}</h3>
                    <p className="mt-2 text-sm leading-7 text-muted-foreground">
                      {description || "No description yet."}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {generatedTags.length > 0 ? (
                      generatedTags.map((tag) => (
                        <Badge key={tag} variant="outline">
                          {tag}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-sm text-muted-foreground">No tags added yet.</span>
                    )}
                  </div>
                </section>

                <section className="space-y-4 border border-border/70 bg-background/35 p-5">
                  <div
                    className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground"
                    style={{ fontFamily: "var(--font-mono)" }}
                  >
                    Publish Details
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <div className="text-xs uppercase tracking-[0.14em] text-muted-foreground" style={{ fontFamily: "var(--font-mono)" }}>
                        Slug
                      </div>
                      <div className="mt-1 text-sm text-foreground">{slug || toSlug(name) || "pending-slug"}</div>
                    </div>
                    <div>
                      <div className="text-xs uppercase tracking-[0.14em] text-muted-foreground" style={{ fontFamily: "var(--font-mono)" }}>
                        Version
                      </div>
                      <div className="mt-1 text-sm text-foreground">{version}</div>
                    </div>
                    <div>
                      <div className="text-xs uppercase tracking-[0.14em] text-muted-foreground" style={{ fontFamily: "var(--font-mono)" }}>
                        Visibility
                      </div>
                      <div className="mt-1 text-sm text-foreground">{isPublic ? "Public" : "Private"}</div>
                    </div>
                    <div>
                      <div className="text-xs uppercase tracking-[0.14em] text-muted-foreground" style={{ fontFamily: "var(--font-mono)" }}>
                        Extra Files
                      </div>
                      <div className="mt-1 text-sm text-foreground">{additionalFiles.length.toLocaleString()}</div>
                    </div>
                  </div>
                </section>
              </div>

              <section className="space-y-3 border border-border/70 bg-background/35 p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div
                      className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground"
                      style={{ fontFamily: "var(--font-mono)" }}
                    >
                      Submission Preview
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Review the generated SKILL.md content before publishing.
                    </p>
                  </div>
                  <Button variant="outline" onClick={() => setStep("draft")}>
                    Edit Draft
                  </Button>
                </div>
                <pre className="max-h-[420px] overflow-auto border border-border/70 bg-black/30 p-4 font-mono text-[13px] text-foreground sm:text-sm">
                  <code>{previewLines}</code>
                </pre>
              </section>

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <Button variant="outline" onClick={() => setStep("setup")}>
                  Back
                </Button>
                <Button onClick={() => publishMutation.mutate()} disabled={publishMutation.isPending}>
                  {publishMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Publishing...
                    </>
                  ) : (
                    "Publish To My Skills"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
