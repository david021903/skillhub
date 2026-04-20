import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Reveal } from "@/components/Reveal";

interface PageIntroProps {
  tag: string;
  title: string;
  description: string;
  actions?: ReactNode;
  className?: string;
}

export function PageIntro({ tag, title, description, actions, className }: PageIntroProps) {
  return (
    <Reveal delay={30} className={cn("flex flex-col gap-5 sm:gap-6 lg:flex-row lg:items-end lg:justify-between", className)}>
      <div className="min-w-0 max-w-4xl">
        <span
          className="inline-flex items-center border border-primary/62 px-2.5 py-1 text-[9px] uppercase tracking-[0.18em] text-primary shadow-[inset_0_0_0_1px_rgba(249,55,40,0.08)] sm:text-[10px]"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          {tag}
        </span>
        <h1 className="mt-4 text-[1.95rem] leading-[1.02] text-foreground sm:mt-5 sm:text-4xl lg:text-5xl">{title}</h1>
        <p className="mt-4 max-w-3xl text-sm leading-6 text-muted-foreground sm:mt-5 sm:leading-7 lg:text-base">
          {description}
        </p>
      </div>

      {actions ? <div className="flex w-full flex-wrap gap-3.5 lg:w-auto lg:justify-end">{actions}</div> : null}
    </Reveal>
  );
}
