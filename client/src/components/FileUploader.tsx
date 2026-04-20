import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import JSZip from "jszip";
import { 
  Upload, 
  X, 
  File, 
  FileText, 
  FileCode, 
  FileJson, 
  Folder,
  FileArchive,
  AlertCircle 
} from "@/components/ui/icons";

interface UploadedFile {
  path: string;
  content: string;
  size: number;
  isBinary: boolean;
}

interface FileUploaderProps {
  files: UploadedFile[];
  onFilesChange: (files: UploadedFile[]) => void;
  maxFiles?: number;
  maxFileSize?: number;
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

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

const IGNORED_FILES = [
  ".git",
  ".gitignore",
  "node_modules",
  ".DS_Store",
  "Thumbs.db",
  ".env",
  ".env.local",
  ".skillignore",
];

const IGNORED_EXTENSIONS = [
  ".pyc",
  ".pyo",
  ".class",
  ".o",
  ".a",
  ".so",
  ".dll",
  ".exe",
];

function shouldIgnoreFile(path: string): boolean {
  const name = path.split("/").pop() || "";
  if (IGNORED_FILES.some(f => name === f || path.includes(`/${f}/`))) {
    return true;
  }
  if (IGNORED_EXTENSIONS.some(ext => name.endsWith(ext))) {
    return true;
  }
  return false;
}

export function FileUploader({ 
  files, 
  onFilesChange, 
  maxFiles = 50, 
  maxFileSize = 1024 * 1024 
}: FileUploaderProps) {
  const { toast } = useToast();
  const [isDragging, setIsDragging] = useState(false);

  const processZipFile = async (file: File): Promise<UploadedFile[]> => {
    const results: UploadedFile[] = [];
    try {
      const zip = await JSZip.loadAsync(file);
      
      for (const [path, zipEntry] of Object.entries(zip.files)) {
        if (zipEntry.dir || shouldIgnoreFile(path)) continue;
        
        const content = await zipEntry.async("string");
        const isBinary = /[\x00-\x08\x0E-\x1F\x7F-\xFF]/.test(content.slice(0, 1000));
        
        results.push({
          path: path.replace(/^[^/]+\//, ""),
          content: isBinary ? "" : content,
          size: content.length,
          isBinary,
        });
      }
      
      toast({
        title: "ZIP extracted",
        description: `Extracted ${results.length} files from ${file.name}`,
      });
    } catch (error) {
      toast({
        title: "Failed to extract ZIP",
        description: "Could not read the ZIP file",
        variant: "destructive",
      });
    }
    return results;
  };

  const processFile = async (file: File, basePath: string = ""): Promise<UploadedFile | null> => {
    if (file.name.endsWith(".zip")) {
      return null;
    }
    
    const path = basePath ? `${basePath}/${file.name}` : file.name;
    
    if (shouldIgnoreFile(path)) {
      return null;
    }
    
    if (file.size > maxFileSize) {
      toast({
        title: "File too large",
        description: `${path} exceeds ${formatFileSize(maxFileSize)} limit`,
        variant: "destructive",
      });
      return null;
    }

    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        const isBinary = /[\x00-\x08\x0E-\x1F\x7F-\xFF]/.test(content.slice(0, 1000));
        resolve({
          path,
          content: isBinary ? "" : content,
          size: file.size,
          isBinary,
        });
      };
      reader.onerror = () => resolve(null);
      reader.readAsText(file);
    });
  };

  const processEntry = async (entry: FileSystemEntry, basePath: string = ""): Promise<UploadedFile[]> => {
    const results: UploadedFile[] = [];
    
    if (entry.isFile) {
      const fileEntry = entry as FileSystemFileEntry;
      const file = await new Promise<File>((resolve, reject) => {
        fileEntry.file(resolve, reject);
      });
      const processed = await processFile(file, basePath);
      if (processed) results.push(processed);
    } else if (entry.isDirectory) {
      const dirEntry = entry as FileSystemDirectoryEntry;
      const dirReader = dirEntry.createReader();
      const entries = await new Promise<FileSystemEntry[]>((resolve) => {
        dirReader.readEntries(resolve);
      });
      const newBasePath = basePath ? `${basePath}/${entry.name}` : entry.name;
      for (const childEntry of entries) {
        const childResults = await processEntry(childEntry, newBasePath);
        results.push(...childResults);
      }
    }
    
    return results;
  };

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const items = e.dataTransfer.items;
    const droppedFiles = e.dataTransfer.files;
    const newFiles: UploadedFile[] = [];
    
    for (let i = 0; i < droppedFiles.length; i++) {
      if (droppedFiles[i].name.endsWith(".zip")) {
        const zipFiles = await processZipFile(droppedFiles[i]);
        newFiles.push(...zipFiles);
      }
    }
    
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const file = item.getAsFile();
      if (file?.name.endsWith(".zip")) continue;
      
      const entry = item.webkitGetAsEntry?.();
      if (entry) {
        const processed = await processEntry(entry);
        newFiles.push(...processed);
      }
    }
    
    if (files.length + newFiles.length > maxFiles) {
      toast({
        title: "Too many files",
        description: `Maximum ${maxFiles} files allowed`,
        variant: "destructive",
      });
      return;
    }
    
    const existingPaths = new Set(files.map(f => f.path));
    const uniqueNewFiles = newFiles.filter(f => !existingPaths.has(f.path));
    onFilesChange([...files, ...uniqueNewFiles]);
  }, [files, maxFiles, onFilesChange, toast]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles) return;
    
    const newFiles: UploadedFile[] = [];
    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      if (file.name.endsWith(".zip")) {
        const zipFiles = await processZipFile(file);
        newFiles.push(...zipFiles);
      } else {
        const processed = await processFile(file);
        if (processed) newFiles.push(processed);
      }
    }
    
    if (files.length + newFiles.length > maxFiles) {
      toast({
        title: "Too many files",
        description: `Maximum ${maxFiles} files allowed`,
        variant: "destructive",
      });
      return;
    }
    
    const existingPaths = new Set(files.map(f => f.path));
    const uniqueNewFiles = newFiles.filter(f => !existingPaths.has(f.path));
    onFilesChange([...files, ...uniqueNewFiles]);
    e.target.value = "";
  };

  const removeFile = (path: string) => {
    onFilesChange(files.filter(f => f.path !== path));
  };

  const totalSize = files.reduce((sum, f) => sum + f.size, 0);

  return (
    <div className="space-y-3">
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          isDragging 
            ? "border-primary bg-primary/5" 
            : "border-muted-foreground/25 hover:border-primary/50"
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
      >
        <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
        <p className="text-sm text-muted-foreground mb-2">
          Drag and drop files, folders, or ZIP archives here, or
        </p>
        <Button variant="outline" size="sm" asChild>
          <label className="cursor-pointer">
            Browse Files
            <input
              type="file"
              multiple
              accept="*/*,.zip"
              className="hidden"
              onChange={handleFileSelect}
            />
          </label>
        </Button>
        <p className="text-xs text-muted-foreground mt-2">
          Max {maxFiles} files, {formatFileSize(maxFileSize)} each
        </p>
      </div>

      {files.length > 0 && (
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium flex items-center gap-2">
                <Folder className="h-4 w-4" />
                {files.length} file{files.length !== 1 ? "s" : ""} 
                <Badge variant="outline" className="text-xs">
                  {formatFileSize(totalSize)}
                </Badge>
              </span>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-7 text-xs text-destructive"
                onClick={() => onFilesChange([])}
              >
                Clear All
              </Button>
            </div>
            <ScrollArea className="max-h-[200px]">
              <div className="space-y-1">
                {files.map((file) => {
                  const Icon = getFileIcon(file.path);
                  return (
                    <div
                      key={file.path}
                      className="flex items-center gap-2 p-1.5 rounded hover:bg-muted/50 group"
                    >
                      <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="text-sm truncate flex-1">{file.path}</span>
                      {file.isBinary && (
                        <Badge variant="secondary" className="text-xs flex-shrink-0">
                          binary
                        </Badge>
                      )}
                      <span className="text-xs text-muted-foreground flex-shrink-0">
                        {formatFileSize(file.size)}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                        onClick={() => removeFile(file.path)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      <div className="flex items-start gap-2 text-xs text-muted-foreground">
        <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
        <span>
          Files like .git, node_modules, .env, and binary files are automatically ignored.
          SKILL.md should be in the root of your skill.
        </span>
      </div>
    </div>
  );
}
