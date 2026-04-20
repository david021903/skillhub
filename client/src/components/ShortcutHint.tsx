import { cn } from "@/lib/utils";

interface ShortcutHintProps {
  isMac: boolean;
  className?: string;
}

export function getShortcutLabel(isMac: boolean) {
  return isMac ? "Command K" : "CTRL K";
}

export function ShortcutHint({ isMac, className }: ShortcutHintProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.14em] leading-none",
        className,
      )}
      aria-label={getShortcutLabel(isMac)}
    >
      {isMac ? (
        <>
          <span className="font-sans text-[12px] leading-none tracking-normal text-foreground/88">
            ⌘
          </span>
          <span className="leading-none text-foreground/72">K</span>
        </>
      ) : (
        <>
          <span className="leading-none text-foreground/72">CTRL</span>
          <span className="leading-none text-foreground/72">K</span>
        </>
      )}
    </span>
  );
}
