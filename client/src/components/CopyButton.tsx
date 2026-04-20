import { useState } from "react";
import { Copy, Check } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";

interface CopyButtonProps {
  text: string;
  className?: string;
  size?: "sm" | "default" | "lg" | "icon";
}

export function CopyButton({ text, className = "", size = "icon" }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <Button
      variant="ghost"
      size={size}
      onClick={handleCopy}
      className={[
        "group/copy",
        className,
        copied
          ? "border-primary/80 bg-primary text-primary-foreground hover:border-primary hover:bg-primary/92"
          : "",
      ].join(" ")}
      title={copied ? "Copied!" : "Copy to clipboard"}
    >
      {copied ? (
        <Check className="h-4 w-4 animate-in zoom-in-75 fade-in-0 duration-200" />
      ) : (
        <Copy className="h-4 w-4 text-muted-foreground transition-[transform,color] duration-200 group-hover/copy:scale-[1.06] group-hover/copy:text-foreground" />
      )}
    </Button>
  );
}
