import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Code, MessageCircle, GitPullRequest, Download, GitFork, Clock, CheckCircle, XCircle, Plus, Pencil, X, Save, Trash2, ShieldCheck, AlertTriangle, FolderOpen } from "lucide-react";
import { FileBrowser } from "./FileBrowser";
import { CopyButton } from "./CopyButton";
import { useLocation } from "wouter";

interface SkillTabsProps {
  skill: any;
  owner: string;
  slug: string;
}

export function SkillTabs({ skill, owner, slug }: SkillTabsProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [selectedVersion, setSelectedVersion] = useState<string | null>(null);
  const [showNewIssue, setShowNewIssue] = useState(false);
  const [showNewPR, setShowNewPR] = useState(false);
  const [issueTitle, setIssueTitle] = useState("");
  const [issueBody, setIssueBody] = useState("");
  const [prTitle, setPrTitle] = useState("");
  const [prBody, setPrBody] = useState("");
  const [prSkillMd, setPrSkillMd] = useState("");
  
  // Edit mode state (GitHub-like flow)
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState("");
  const [commitMessage, setCommitMessage] = useState("");
  const [newVersion, setNewVersion] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [validationResult, setValidationResult] = useState<any>(null);
  const [isValidating, setIsValidating] = useState(false);
  
  const skillOwnerId = skill?.ownerId || skill?.owner?.id;
  const isOwner = user?.id && skillOwnerId && String(user.id) === String(skillOwnerId);

  const { data: issues } = useQuery({
    queryKey: ["/api/skills", skill?.id, "issues"],
    queryFn: async () => {
      const res = await fetch(`/api/skills/${skill.id}/issues`);
      return res.json();
    },
    enabled: !!skill?.id,
  });

  const { data: pulls } = useQuery({
    queryKey: ["/api/skills", skill?.id, "pulls"],
    queryFn: async () => {
      const res = await fetch(`/api/skills/${skill.id}/pulls`);
      return res.json();
    },
    enabled: !!skill?.id,
  });

  const forkMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/skills/${skill.id}/fork`, { method: "POST", credentials: "include" });
      if (!res.ok) throw new Error("Failed to fork");
      return res.json();
    },
    onSuccess: (data) => {
      toast({ title: "Forked!", description: `Skill forked to ${data.owner?.handle}/${data.slug}` });
      queryClient.invalidateQueries({ queryKey: ["/api/skills", owner, slug] });
    },
    onError: () => toast({ title: "Error", description: "Failed to fork skill", variant: "destructive" }),
  });

  const createIssueMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/skills/${skill.id}/issues`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ title: issueTitle, body: issueBody }),
      });
      if (!res.ok) throw new Error("Failed to create issue");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Issue created" });
      setShowNewIssue(false);
      setIssueTitle("");
      setIssueBody("");
      queryClient.invalidateQueries({ queryKey: ["/api/skills", skill.id, "issues"] });
    },
  });

  const createPRMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/skills/${skill.id}/pulls`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ 
          title: prTitle, 
          body: prBody, 
          proposedSkillMd: prSkillMd,
          baseVersion: skill.versions?.[0]?.version 
        }),
      });
      if (!res.ok) throw new Error("Failed to create pull request");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Pull request created" });
      setShowNewPR(false);
      setPrTitle("");
      setPrBody("");
      setPrSkillMd("");
      queryClient.invalidateQueries({ queryKey: ["/api/skills", skill.id, "pulls"] });
    },
  });

  // Commit changes mutation (GitHub-like save)
  const commitMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/skills/${skill.id}/versions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ 
          skillMd: editedContent,
          version: newVersion,
          changelog: commitMessage 
        }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to commit changes");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Changes committed!", description: `Version ${newVersion} published` });
      setIsEditing(false);
      setEditedContent("");
      setCommitMessage("");
      setNewVersion("");
      queryClient.invalidateQueries({ queryKey: ["/api/skills", owner, slug] });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const startEditing = () => {
    const currentContent = displayedVersion?.skillMd || "";
    setEditedContent(currentContent);
    const currentVersion = displayedVersion?.version || "1.0.0";
    const parts = currentVersion.split(".");
    parts[2] = String(parseInt(parts[2] || "0") + 1);
    setNewVersion(parts.join("."));
    setCommitMessage("");
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditedContent("");
    setCommitMessage("");
    setNewVersion("");
  };

  // Delete skill mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/skills/${skill.id}`, { method: "DELETE", credentials: "include" });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to delete skill");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Skill deleted", description: "The skill has been permanently deleted" });
      setLocation("/my-skills");
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Validate skill
  const runValidation = async () => {
    setIsValidating(true);
    setValidationResult(null);
    try {
      const res = await fetch(`/api/skills/${skill.id}/validate`, { method: "POST", credentials: "include" });
      const result = await res.json();
      setValidationResult(result);
      if (result.passed) {
        toast({ title: "Validation passed!", description: `Score: ${result.score}%` });
      } else {
        toast({ title: "Validation issues found", description: `Score: ${result.score}%`, variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to validate skill", variant: "destructive" });
    } finally {
      setIsValidating(false);
    }
  };

  const displayedVersion = selectedVersion 
    ? skill.versions?.find((v: any) => v.version === selectedVersion)
    : skill.versions?.[0];

  return (
    <Tabs defaultValue="code" className="w-full">
      <div className="flex items-center justify-between mb-4">
        <TabsList>
          <TabsTrigger value="code" className="gap-2">
            <Code className="h-4 w-4" />
            Code
          </TabsTrigger>
          <TabsTrigger value="issues" className="gap-2">
            <MessageCircle className="h-4 w-4" />
            Issues
            {issues?.length > 0 && <Badge variant="secondary" className="ml-1">{issues.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="pulls" className="gap-2">
            <GitPullRequest className="h-4 w-4" />
            Pull Requests
            {pulls?.length > 0 && <Badge variant="secondary" className="ml-1">{pulls.length}</Badge>}
          </TabsTrigger>
        </TabsList>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="gap-2" 
            onClick={runValidation} 
            disabled={isValidating}
          >
            <ShieldCheck className="h-4 w-4" />
            {isValidating ? "Validating..." : "Validate"}
          </Button>
          {user && !isOwner && (
            <Button variant="outline" size="sm" className="gap-2" onClick={() => forkMutation.mutate()} disabled={forkMutation.isPending}>
              <GitFork className="h-4 w-4" />
              Fork {skill.forks > 0 && `(${skill.forks})`}
            </Button>
          )}
          {isOwner && (
            <>
              {!showDeleteConfirm ? (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-2 text-destructive hover:text-destructive" 
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              ) : (
                <div className="flex gap-2 items-center">
                  <span className="text-sm text-destructive">Delete this skill?</span>
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={() => deleteMutation.mutate()}
                    disabled={deleteMutation.isPending}
                  >
                    {deleteMutation.isPending ? "Deleting..." : "Confirm"}
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setShowDeleteConfirm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Validation Results */}
      {validationResult && (
        <Card className={`mb-4 ${validationResult.passed ? "border-green-500" : "border-yellow-500"}`}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                {validationResult.passed ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                )}
                Validation Results
              </CardTitle>
              <Badge variant={validationResult.passed ? "default" : "secondary"}>
                Score: {validationResult.score}%
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {validationResult.checks?.map((check: any, i: number) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  {check.status === "passed" ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : check.status === "warning" ? (
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500" />
                  )}
                  <span className={check.status === "failed" ? "text-red-600" : ""}>
                    {check.message}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <TabsContent value="code" className="space-y-4">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Versions</CardTitle>
              <select 
                className="border rounded px-3 py-1 text-sm"
                value={selectedVersion || displayedVersion?.version || ""}
                onChange={(e) => setSelectedVersion(e.target.value)}
              >
                {skill.versions?.map((v: any) => (
                  <option key={v.id} value={v.version}>
                    {v.version} {v.isLatest && "(latest)"}
                  </option>
                ))}
              </select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {skill.versions?.map((version: any) => (
                <div
                  key={version.id}
                  className={`flex items-center justify-between p-3 rounded-lg transition-colors cursor-pointer ${
                    (selectedVersion || displayedVersion?.version) === version.version 
                      ? "bg-primary/10 border border-primary/20" 
                      : "bg-muted/50 hover:bg-muted"
                  }`}
                  onClick={() => setSelectedVersion(version.version)}
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-medium">{version.version}</span>
                    {version.isLatest && <Badge variant="default">Latest</Badge>}
                    {version.isYanked && <Badge variant="destructive">Yanked</Badge>}
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Download className="h-4 w-4" />
                      {version.downloads || 0}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      {new Date(version.publishedAt).toLocaleDateString()}
                    </div>
                    <Button variant="ghost" size="sm" asChild>
                      <a href={`/api/skills/${owner}/${slug}/download/${version.version}`} download>
                        <Download className="h-4 w-4" />
                      </a>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* File Browser - GitHub-like file tree */}
        <FileBrowser 
          owner={owner} 
          slug={slug} 
          version={selectedVersion || displayedVersion?.version} 
        />

        {displayedVersion?.skillMd && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div className="flex items-center gap-3">
                <CardTitle className="text-lg font-mono">SKILL.md</CardTitle>
                {isEditing && <Badge variant="secondary">Editing</Badge>}
              </div>
              <div className="flex items-center gap-2">
                {!isEditing ? (
                  <>
                    {isOwner && (
                      <Button variant="outline" size="sm" className="gap-2" onClick={startEditing}>
                        <Pencil className="h-4 w-4" />
                        Edit
                      </Button>
                    )}
                    {!isOwner && user && (
                      <Button variant="outline" size="sm" className="gap-2" onClick={() => {
                        setPrSkillMd(displayedVersion.skillMd);
                        setShowNewPR(true);
                      }}>
                        <Pencil className="h-4 w-4" />
                        Propose Changes
                      </Button>
                    )}
                    <Button variant="outline" size="sm" asChild>
                      <a href={`/api/skills/${owner}/${slug}/download/${displayedVersion.version}`} download className="gap-2">
                        <Download className="h-4 w-4" />
                        Download
                      </a>
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="ghost" size="sm" className="gap-2" onClick={cancelEditing}>
                      <X className="h-4 w-4" />
                      Cancel
                    </Button>
                  </>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <div className="space-y-4">
                  <Textarea 
                    value={editedContent}
                    onChange={(e) => setEditedContent(e.target.value)}
                    className="font-mono text-sm min-h-[400px]"
                    placeholder="Enter your SKILL.md content..."
                  />
                  
                  <Card className="border-2 border-dashed">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Commit changes</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-sm text-muted-foreground block mb-1">New Version</label>
                          <Input 
                            value={newVersion}
                            onChange={(e) => setNewVersion(e.target.value)}
                            placeholder="1.0.1"
                            className="font-mono"
                          />
                        </div>
                        <div>
                          <label className="text-sm text-muted-foreground block mb-1">Commit message</label>
                          <Input 
                            value={commitMessage}
                            onChange={(e) => setCommitMessage(e.target.value)}
                            placeholder="Update SKILL.md"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={cancelEditing}>
                          Cancel
                        </Button>
                        <Button 
                          onClick={() => commitMutation.mutate()}
                          disabled={commitMutation.isPending || !editedContent || !newVersion}
                          className="gap-2"
                        >
                          <Save className="h-4 w-4" />
                          {commitMutation.isPending ? "Committing..." : "Commit changes"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <div className="relative">
                  <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm whitespace-pre-wrap font-mono pr-12">
                    {displayedVersion.skillMd}
                  </pre>
                  <CopyButton 
                    text={displayedVersion.skillMd} 
                    className="absolute top-2 right-2"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {displayedVersion?.changelog && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Changelog</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="whitespace-pre-wrap text-sm">{displayedVersion.changelog}</pre>
            </CardContent>
          </Card>
        )}
      </TabsContent>

      <TabsContent value="issues" className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Issues</h3>
          {user && (
            <Button size="sm" className="gap-2" onClick={() => setShowNewIssue(!showNewIssue)}>
              <Plus className="h-4 w-4" />
              New Issue
            </Button>
          )}
        </div>

        {showNewIssue && (
          <Card>
            <CardContent className="pt-4 space-y-4">
              <Input 
                placeholder="Issue title" 
                value={issueTitle} 
                onChange={(e) => setIssueTitle(e.target.value)} 
              />
              <Textarea 
                placeholder="Describe the issue..." 
                value={issueBody} 
                onChange={(e) => setIssueBody(e.target.value)}
                rows={4}
              />
              <div className="flex gap-2">
                <Button onClick={() => createIssueMutation.mutate()} disabled={!issueTitle || createIssueMutation.isPending}>
                  Create Issue
                </Button>
                <Button variant="outline" onClick={() => setShowNewIssue(false)}>Cancel</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {issues?.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No issues yet</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {issues?.map((issue: any) => (
              <Card key={issue.id} className="hover:bg-muted/30 transition-colors cursor-pointer">
                <CardContent className="py-3 px-4">
                  <div className="flex items-start gap-3">
                    {issue.state === "open" ? (
                      <MessageCircle className="h-5 w-5 text-green-600 mt-0.5" />
                    ) : (
                      <CheckCircle className="h-5 w-5 text-purple-600 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{issue.title}</span>
                        <Badge variant={issue.state === "open" ? "default" : "secondary"}>{issue.state}</Badge>
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        #{issue.number} opened by {issue.author?.handle || "unknown"} on {new Date(issue.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </TabsContent>

      <TabsContent value="pulls" className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Pull Requests</h3>
          {user && (
            <Button size="sm" className="gap-2" onClick={() => setShowNewPR(!showNewPR)}>
              <Plus className="h-4 w-4" />
              New Pull Request
            </Button>
          )}
        </div>

        {showNewPR && (
          <Card>
            <CardContent className="pt-4 space-y-4">
              <Input 
                placeholder="Pull request title" 
                value={prTitle} 
                onChange={(e) => setPrTitle(e.target.value)} 
              />
              <Textarea 
                placeholder="Describe your changes..." 
                value={prBody} 
                onChange={(e) => setPrBody(e.target.value)}
                rows={3}
              />
              <div>
                <label className="text-sm font-medium mb-2 block">Proposed SKILL.md content:</label>
                <Textarea 
                  placeholder="Paste your proposed SKILL.md content here..." 
                  value={prSkillMd} 
                  onChange={(e) => setPrSkillMd(e.target.value)}
                  rows={10}
                  className="font-mono text-sm"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={() => createPRMutation.mutate()} disabled={!prTitle || !prSkillMd || createPRMutation.isPending}>
                  Create Pull Request
                </Button>
                <Button variant="outline" onClick={() => setShowNewPR(false)}>Cancel</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {pulls?.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              <GitPullRequest className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No pull requests yet</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {pulls?.map((pr: any) => (
              <Card key={pr.id} className="hover:bg-muted/30 transition-colors cursor-pointer">
                <CardContent className="py-3 px-4">
                  <div className="flex items-start gap-3">
                    {pr.state === "open" ? (
                      <GitPullRequest className="h-5 w-5 text-green-600 mt-0.5" />
                    ) : pr.state === "merged" ? (
                      <GitPullRequest className="h-5 w-5 text-purple-600 mt-0.5" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{pr.title}</span>
                        <Badge variant={pr.state === "open" ? "default" : pr.state === "merged" ? "secondary" : "destructive"}>
                          {pr.state}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        #{pr.number} opened by {pr.author?.handle || "unknown"} on {new Date(pr.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}
