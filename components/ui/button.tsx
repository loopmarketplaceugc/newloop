import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[8px] text-sm font-medium transition-colors duration-150 disabled:pointer-events-none disabled:opacity-40 [&_svg]:size-4 [&_svg]:shrink-0 cursor-pointer select-none",
  {
    variants: {
      variant: {
        /* ink primary — Claude style */
        default: "bg-text-primary text-bg hover:bg-text-secondary",
        outline:
          "border border-border bg-surface text-text-primary hover:border-border-bright hover:bg-surface-2",
        ghost: "text-text-secondary hover:text-text-primary hover:bg-surface-2",
        /* sage green reserved for money / success actions */
        money: "bg-money text-white font-semibold hover:bg-money-bright",
        moneyOutline:
          "border border-money/40 text-money hover:border-money hover:bg-money-soft",
        /* terracotta reserved for AI features */
        ai: "bg-ai text-white font-semibold hover:bg-ai-bright",
        aiOutline: "border border-ai/40 text-ai hover:border-ai hover:bg-ai-soft",
        danger: "border border-danger/40 text-danger hover:border-danger hover:bg-danger/10",
      },
      size: {
        default: "h-9 px-4",
        sm: "h-8 px-3 text-[13px]",
        lg: "h-11 px-6 text-[15px]",
        icon: "h-9 w-9",
        iconSm: "h-8 w-8",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
