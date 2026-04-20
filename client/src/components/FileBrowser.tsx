import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  File, Folder, FolderOpen, ChevronRight, ChevronDown, 
  FileText, FileCode, FileJson, Download, Copy, Eye 
} from "@/components/ui/icons";
import { useToast } from "@/hooks/use-toast";
import { FRONTEND_ONLY_PREVIEW } from "@/lib/frontend-only";

interface FileInfo {
  id: string;
  path: string;
  size: number;
  isBinary: boolean;
  mimeType: string;
  sha256: string | null;
  createdAt: string;
}

interface FileBrowserProps {
  owner: string;
  slug: string;
  version?: string;
}

interface TreeNode {
  name: string;
  path: string;
  type: "file" | "folder";
  children?: TreeNode[];
  file?: FileInfo;
}

function buildFileTree(files: FileInfo[]): TreeNode[] {
  const root: TreeNode[] = [];

  for (const file of files) {
    const parts = file.path.split("/");
    let currentLevel = root;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isFile = i === parts.length - 1;
      const path = parts.slice(0, i + 1).join("/");

      let existing = currentLevel.find((n) => n.name === part);

      if (!existing) {
        existing = {
          name: part,
          path,
          type: isFile ? "file" : "folder",
          children: isFile ? undefined : [],
          file: isFile ? file : undefined,
        };
        currentLevel.push(existing);
      }

      if (!isFile && existing.children) {
        currentLevel = existing.children;
      }
    }
  }

  const sortNodes = (nodes: TreeNode[]): TreeNode[] => {
    return nodes.sort((a, b) => {
      if (a.type !== b.type) return a.type === "folder" ? -1 : 1;
      return a.name.localeCompare(b.name);
    }).map((node) => ({
      ...node,
      children: node.children ? sortNodes(node.children) : undefined,
    }));
  };

  return sortNodes(root);
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

function getFileIcon(path: string) {
  const ext = path.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "md":
    case "txt":
      return FileText;
    case "js":
    case "ts":
    case "py":
    case "sh":
    case "bash":
      return FileCode;
    case "json":
    case "yaml":
    case "yml":
      return FileJson;
    default:
      return File;
  }
}

function FileTreeNode({ 
  node, 
  depth = 0, 
  selectedFile, 
  onSelectFile 
}: { 
  node: TreeNode; 
  depth?: number; 
  selectedFile: string | null;
  onSelectFile: (path: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(depth < 2);
  const FileIcon = node.type === "file" ? getFileIcon(node.path) : (isOpen ? FolderOpen : Folder);
  const isSelected = selectedFile === node.path;

  if (node.type === "folder") {
    return (
      <div>
        <button
          className="flex w-full items-center gap-1.5 px-2 py-1.5 text-left text-sm hover:bg-accent"
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
          <FileIcon className="h-4 w-4 text-yellow-500" />
          <span className="truncate">{node.name}</span>
        </button>
        {isOpen && node.children && (
          <div>
            {node.children.map((child) => (
              <FileTreeNode
                key={child.path}
                node={child}
                depth={depth + 1}
                selectedFile={selectedFile}
                onSelectFile={onSelectFile}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <button
      className={`flex w-full items-center gap-2 px-2 py-1.5 text-left text-sm hover:bg-accent ${
        isSelected ? "bg-accent" : ""
      }`}
      style={{ paddingLeft: `${depth * 12 + 24}px` }}
      onClick={() => onSelectFile(node.path)}
    >
      <FileIcon className="h-4 w-4 text-muted-foreground" />
      <span className="truncate flex-1">{node.name}</span>
      {node.file && (
        <span className="text-xs text-muted-foreground">
          {formatFileSize(node.file.size)}
        </span>
      )}
    </button>
  );
}

function FileViewer({ 
  owner, 
  slug, 
  filePath, 
  version 
}: { 
  owner: string; 
  slug: string; 
  filePath: string; 
  version?: string;
}) {
  const { toast } = useToast();

  const { data: fileContent, isLoading } = useQuery({
    queryKey: ["/api/skills", owner, slug, "files", filePath, version],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (version) params.set("version", version);
      const res = await fetch(`/api/skills/${owner}/${slug}/files/${filePath}?${params}`);
      if (!res.ok) throw new Error("Failed to fetch file");
      return res.json();
    },
    enabled: !!filePath,
  });

  const copyContent = () => {
    if (fileContent?.content) {
      navigator.clipboard.writeText(fileContent.content);
      toast({ title: "Copied!", description: "File content copied to clipboard" });
    }
  };

  const downloadFile = () => {
    if (fileContent?.content) {
      const blob = new Blob([fileContent.content], { type: fileContent.mimeType || "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filePath.split("/").pop() || "file";
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-6 w-6 animate-spin border-2 border-primary border-r-transparent" />
      </div>
    );
  }

  if (!fileContent) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        Select a file to view its contents
      </div>
    );
  }

  if (fileContent.isBinary) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <File className="h-12 w-12 text-muted-foreground" />
        <p className="text-muted-foreground">Binary file ({formatFileSize(fileContent.size)})</p>
        <Button onClick={downloadFile} variant="outline" size="sm" className="gap-2">
          <Download className="h-4 w-4" />
          Download
        </Button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex flex-col gap-3 border-b bg-muted/30 p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-2">
          <span className="truncate text-sm font-medium">{filePath}</span>
          <Badge variant="secondary" className="text-xs">
            {formatFileSize(fileContent.size)}
          </Badge>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={copyContent} className="h-7 px-2">
            <Copy className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={downloadFile} className="h-7 px-2">
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <ScrollArea className="flex-1">
        <pre className="p-4 text-sm font-mono whitespace-pre-wrap break-all">
          {fileContent.content}
        </pre>
      </ScrollArea>
    </div>
  );
}

export function FileBrowser({ owner, slug, version }: FileBrowserProps) {
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"tree" | "list">("tree");
  const { toast } = useToast();

  const { data, isLoading } = useQuery({
    queryKey: ["/api/skills", owner, slug, "files", version],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (version) params.set("version", version);
      const res = await fetch(`/api/skills/${owner}/${slug}/files?${params}`);
      if (!res.ok) throw new Error("Failed to fetch files");
      return res.json();
    },
  });

  const files = data?.files || [];
  const fileTree = buildFileTree(files);

  if (isLoading) {
    return (
      <Card className="border-border bg-card/40">
        <CardHeader>
          <CardTitle className="text-lg text-foreground">Files</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center">
            <div className="h-6 w-6 animate-spin border-2 border-primary border-r-transparent" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border bg-card/40">
      <CardHeader className="gap-4 border-b border-border/70 pb-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            <CardTitle className="text-lg text-foreground">Files</CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              <span
                className="inline-flex h-11 items-center border border-border/80 bg-background/60 px-4 font-mono text-[0.7rem] uppercase tracking-[0.16em] text-muted-foreground"
              >
                {(data?.totalFiles || 0).toLocaleString()} Files
              </span>
              <span
                className="inline-flex h-11 items-center border border-border/80 bg-background/60 px-4 font-mono text-[0.7rem] uppercase tracking-[0.16em] text-muted-foreground"
              >
                {formatFileSize(data?.totalSize || 0)}
              </span>
            </div>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            {FRONTEND_ONLY_PREVIEW ? (
              <Button
                variant="outline"
                size="sm"
                className="h-11 gap-2 border-border/80 bg-background/60 px-4 font-mono text-[0.7rem] uppercase tracking-[0.16em]"
                onClick={() => {
                  toast({
                    title: "ZIP export disabled in preview",
                    description: "Individual file downloads still work in frontend-only mode.",
                  });
                }}
              >
                <Download className="h-4 w-4" />
                Download ZIP
              </Button>
            ) : (
              <Button 
                variant="outline" 
                size="sm" 
                className="h-11 gap-2 border-border/80 bg-background/60 px-4 font-mono text-[0.7rem] uppercase tracking-[0.16em]"
                asChild
              >
                <a href={`/api/skills/${owner}/${slug}/download-zip${version ? `/${version}` : ""}`} download>
                  <Download className="h-4 w-4" />
                  Download ZIP
                </a>
              </Button>
            )}
            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "tree" | "list")} className="w-full sm:w-auto">
              <TabsList className="h-11 w-full border border-border/80 bg-background/60 p-1 sm:w-auto">
                <TabsTrigger
                  value="tree"
                  className="min-h-[2.05rem] min-w-[4.75rem] flex-1 px-4 font-mono text-[0.7rem] uppercase tracking-[0.16em] sm:flex-none"
                >
                  Tree
                </TabsTrigger>
                <TabsTrigger
                  value="list"
                  className="min-h-[2.05rem] min-w-[4.75rem] flex-1 px-4 font-mono text-[0.7rem] uppercase tracking-[0.16em] sm:flex-none"
                >
                  List
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="grid grid-cols-1 xl:grid-cols-3">
          <div className="border-b border-border/70 xl:border-b-0 xl:border-r xl:border-r-border/70">
            <ScrollArea className="h-[320px] sm:h-[360px] xl:h-[400px]">
              <div className="p-2">
                {viewMode === "tree" ? (
                  fileTree.map((node) => (
                    <FileTreeNode
                      key={node.path}
                      node={node}
                      selectedFile={selectedFile}
                      onSelectFile={setSelectedFile}
                    />
                  ))
                ) : (
                  files.map((file: FileInfo) => (
                    <button
                      key={file.path}
                      className={`flex w-full items-center gap-2 px-2 py-1.5 text-left text-sm hover:bg-accent ${
                        selectedFile === file.path ? "bg-accent" : ""
                      }`}
                      onClick={() => setSelectedFile(file.path)}
                    >
                      {(() => {
                        const Icon = getFileIcon(file.path);
                        return <Icon className="h-4 w-4 text-muted-foreground" />;
                      })()}
                      <span className="truncate flex-1">{file.path}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatFileSize(file.size)}
                      </span>
                    </button>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
          <div className="h-[320px] sm:h-[360px] xl:col-span-2 xl:h-[400px]">
            {selectedFile ? (
              <FileViewer 
                owner={owner} 
                slug={slug} 
                filePath={selectedFile} 
                version={version} 
              />
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <div className="text-center">
                  <Eye className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Select a file to view its contents</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
