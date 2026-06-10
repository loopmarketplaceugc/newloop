import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-medium whitespace-nowrap",
  {
    variants: {
      variant: {
        default: "border-border bg-surface-2 text-text-secondary",
        outline: "border-border text-text-tertiary",
        money: "border-money/25 bg-money-soft text-money",
        ai: "border-ai/25 bg-ai-soft text-ai",
        amber: "border-amber/25 bg-amber/10 text-amber",
        danger: "border-danger/25 bg-danger/10 text-danger",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
