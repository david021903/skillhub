import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "whitespace-nowrap inline-flex items-center rounded-none border px-2.5 py-0.5 text-[0.8rem] font-semibold transition-[transform,background-color,border-color,color] duration-200 ease-out focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 hover-elevate hover:-translate-y-px",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground shadow-none",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        destructive: "border-transparent bg-destructive text-destructive-foreground shadow-none",
        outline: "border [border-color:var(--badge-outline)] shadow-none",
        success: "border border-profit/25 bg-profit/10 text-profit shadow-none",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
