import type * as React from "react";
import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  eyebrow,
  body,
  action,
}: {
  title: string;
  eyebrow?: string;
  body?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end">
      <div>
        {eyebrow ? (
          <p className="mb-2 text-[12px] font-medium uppercase text-text-tertiary">{eyebrow}</p>
        ) : null}
        <h1 className="font-serif text-3xl font-semibold leading-tight md:text-4xl">{title}</h1>
        {body ? <p className="mt-2 max-w-2xl text-sm leading-relaxed text-text-secondary">{body}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function SurfaceGrid({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("grid gap-4", className)}>{children}</div>;
}
