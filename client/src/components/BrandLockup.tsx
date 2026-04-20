import { cn } from "@/lib/utils";

interface BrandLockupProps {
  className?: string;
  iconOnly?: boolean;
  compact?: boolean;
  sidebar?: boolean;
}

export function BrandLockup({
  className,
  iconOnly = false,
  compact = false,
  sidebar = false,
}: BrandLockupProps) {
  return (
    <div className={cn("flex min-w-0 items-center", sidebar ? "gap-3.5" : "gap-2.5", className)}>
      {iconOnly ? (
        <div
          className={cn(
            "flex shrink-0 items-center justify-center border border-border bg-card/80 p-2",
            compact ? "h-10 w-10" : "h-11 w-11",
          )}
        >
          <img
            src="/traderclaw-logo-icon.svg"
            alt="TraderClaw"
            className="h-full w-full object-contain"
          />
        </div>
      ) : (
        <>
          <img
            src="/traderclaw-logo.svg"
            alt="TraderClaw"
            className={cn(
              "w-auto shrink-0 object-contain",
              sidebar
                ? "h-[1.65rem] max-w-[212px]"
                : compact
                  ? "h-4 max-w-[150px]"
                  : "h-5 max-w-[220px]",
            )}
          />
          <span
            className={cn(
              "inline-flex shrink-0 items-center justify-center border border-primary/40 uppercase leading-none text-primary text-center",
              sidebar
                ? "min-h-[1.4rem] px-2.5 py-[0.22rem] text-[9px] tracking-[0.18em]"
                : compact
                  ? "px-2 py-0.5 text-[9px] tracking-[0.18em]"
                  : "px-2.5 py-0.5 text-[10px] tracking-[0.2em]",
            )}
            style={{ fontFamily: "var(--font-mono)" }}
          >
            Skills
          </span>
        </>
      )}
    </div>
  );
}
