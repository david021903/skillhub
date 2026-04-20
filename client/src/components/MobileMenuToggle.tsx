import { cn } from "@/lib/utils";

interface MobileMenuToggleProps {
  open: boolean;
  onClick: () => void;
  className?: string;
  label?: string;
}

export function MobileMenuToggle({
  open,
  onClick,
  className,
  label = "Toggle navigation menu",
}: MobileMenuToggleProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-expanded={open}
      className={cn(
        "inline-flex h-11 w-11 items-center justify-center border border-border/80 bg-card/45 text-foreground transition-[transform,background-color,border-color,box-shadow] duration-300 ease-out hover:-translate-y-[1px] hover:border-primary/30 hover:bg-card/72 focus:outline-none focus:ring-1 focus:ring-ring focus:ring-offset-0 active:translate-y-0 active:scale-[0.985]",
        open && "border-primary/35 bg-primary/10 shadow-[inset_0_0_0_1px_rgba(249,55,40,0.08)]",
        className,
      )}
    >
      <span className="relative block h-4 w-5">
        <span
          className={cn(
            "absolute left-0 top-[3px] h-[1.5px] w-full origin-center bg-current transition-[transform,top,opacity] duration-300 ease-out",
            open && "top-[7px] rotate-45",
          )}
        />
        <span
          className={cn(
            "absolute left-0 top-[10px] h-[1.5px] w-full origin-center bg-current transition-[transform,top,opacity] duration-300 ease-out",
            open && "top-[7px] -rotate-45",
          )}
        />
      </span>
    </button>
  );
}
