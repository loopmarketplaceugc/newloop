import * as React from "react";
import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      className={cn(
        "flex h-9 w-full rounded-[8px] border border-border bg-surface-2 px-3 py-1 text-sm text-text-primary transition-colors",
        "placeholder:text-text-tertiary hover:border-border-bright",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      ref={ref}
      {...props}
    />
  ),
);
Input.displayName = "Input";

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    className={cn(
      "flex min-h-[80px] w-full rounded-[8px] border border-border bg-surface-2 px-3 py-2 text-sm text-text-primary transition-colors",
      "placeholder:text-text-tertiary hover:border-border-bright resize-none",
      "disabled:cursor-not-allowed disabled:opacity-50",
      className,
    )}
    ref={ref}
    {...props}
  />
));
Textarea.displayName = "Textarea";

const Label = ({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) => (
  <label
    className={cn("text-[13px] font-medium text-text-secondary", className)}
    {...props}
  />
);

export { Input, Textarea, Label };
