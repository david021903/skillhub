import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  File, Folder, FolderOpen, ChevronRight, ChevronDown, 
  FileText, FileCode, FileJson, Download, Copy, Eye 
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
          className="flex items-center gap-1 px-2 py-1 w-full text-left hover:bg-accent rounded text-sm"
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
      className={`flex items-center gap-2 px-2 py-1 w-full text-left hover:bg-accent rounded text-sm ${
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
        <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
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
      <div className="flex items-center justify-between p-2 border-b bg-muted/30">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{filePath}</span>
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Folder className="h-5 w-5" />
            Files
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center">
            <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Folder className="h-5 w-5" />
            Files
            <Badge variant="secondary" className="ml-2">
              {data?.totalFiles || 0} files
            </Badge>
            <Badge variant="outline" className="text-xs">
              {formatFileSize(data?.totalSize || 0)}
            </Badge>
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="h-8 gap-1"
              asChild
            >
              <a href={`/api/skills/${owner}/${slug}/download-zip${version ? `/${version}` : ""}`} download>
                <Download className="h-4 w-4" />
                Download ZIP
              </a>
            </Button>
            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "tree" | "list")}>
              <TabsList className="h-8">
                <TabsTrigger value="tree" className="text-xs px-2">Tree</TabsTrigger>
                <TabsTrigger value="list" className="text-xs px-2">List</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="grid grid-cols-1 md:grid-cols-3 border-t">
          <div className="border-r">
            <ScrollArea className="h-[400px]">
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
                      className={`flex items-center gap-2 px-2 py-1 w-full text-left hover:bg-accent rounded text-sm ${
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
          <div className="md:col-span-2 h-[400px]">
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
