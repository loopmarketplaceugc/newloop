import { cn } from "@/lib/utils";

/** Demo avatars: warm pastel gradient + initials, hue seeded per profile. */
export function Avatar({
  name,
  hue,
  size = "md",
  className,
}: {
  name: string;
  hue: number;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
}) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <div
      aria-hidden="true"
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full font-semibold text-white/95 select-none",
        size === "xs" && "h-6 w-6 text-[9px]",
        size === "sm" && "h-8 w-8 text-[11px]",
        size === "md" && "h-10 w-10 text-[13px]",
        size === "lg" && "h-14 w-14 text-base",
        size === "xl" && "h-20 w-20 text-xl",
        className,
      )}
      style={{
        background: `linear-gradient(135deg, hsl(${hue} 45% 62%), hsl(${(hue + 45) % 360} 40% 48%))`,
      }}
    >
      {initials}
    </div>
  );
}
