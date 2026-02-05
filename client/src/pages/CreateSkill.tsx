import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

const SKILL_TEMPLATE = `---
name: my-skill
description: A brief description of what this skill does
metadata:
  openclaw:
    requires:
      bins: []
      env: []
---

# My Skill

## Overview
One sentence summary of what the skill does.

## Capabilities
- Bullet list of capabilities

## Permissions & Safety
- Required permissions (filesystem/network/etc)
- Safety constraints

## Usage Examples
\`\`\`bash
# example usage
\`\`\`
`;

export default function CreateSkill() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [version, setVersion] = useState("0.1.0");
  const [skillMd, setSkillMd] = useState(SKILL_TEMPLATE);

  const createMutation = useMutation({
    mutationFn: async () => {
      const skillRes = await fetch("/api/skills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          slug: slug || name.toLowerCase().replace(/\s+/g, "-"),
          description,
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

  return (
    <div className="max-w-3xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Create New Skill</CardTitle>
          <CardDescription>
            Publish a new skill to the SkillBook registry for the OpenClaw community.
          </CardDescription>
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
              <Button type="button" variant="outline" onClick={() => navigate("/")}>
                Cancel
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
