import { cn } from "@/lib/utils";

/** Infinite scrolling text strip — content duplicated for a seamless loop. */
export function Marquee({
  items,
  reverse,
  className,
  separator = "✦",
}: {
  items: string[];
  reverse?: boolean;
  className?: string;
  separator?: string;
}) {
  const row = [...items, ...items];
  return (
    <div className={cn("overflow-hidden whitespace-nowrap py-3", className)} aria-hidden="true">
      <div className={cn("marquee-track items-center gap-6", reverse && "reverse")}>
        {row.map((item, i) => (
          <span key={i} className="flex shrink-0 items-center gap-6 font-serif text-lg font-bold uppercase tracking-wide sm:text-xl">
            {item}
            <span className="opacity-60">{separator}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
