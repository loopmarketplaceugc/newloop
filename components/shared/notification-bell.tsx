"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import { useApp } from "@/lib/store/app";
import { useSession } from "@/lib/store/session";
import { cn } from "@/lib/utils";

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diffMs / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/**
 * Notification bell + dropdown. Reads the current user's notifications from the
 * store (populated cross-user by DB triggers via the poll), shows an unread
 * count, marks them read on open, and routes to each notification's href.
 */
export function NotificationBell({
  align = "left",
  tone = "onLight",
  className,
}: {
  align?: "left" | "right";
  tone?: "onDark" | "onLight";
  className?: string;
}) {
  const router = useRouter();
  const userId = useSession((s) => s.userId);
  const notifications = useApp((s) => s.notifications);
  const markRead = useApp((s) => s.markNotificationsRead);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const mine = notifications.filter((n) => n.userId === userId);
  const unread = mine.filter((n) => !n.read).length;
  const shown = mine.slice(0, 30);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, [open]);

  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (next && unread > 0 && userId) markRead(userId);
  };

  const go = (href?: string) => {
    setOpen(false);
    if (href) router.push(href);
  };

  return (
    <div ref={ref} className={cn("relative", className)}>
      <button
        type="button"
        onClick={toggle}
        aria-label={unread > 0 ? `Notifications (${unread} unread)` : "Notifications"}
        className={cn(
          "relative rounded-full p-2 transition-colors cursor-pointer",
          tone === "onDark"
            ? "text-[#faf6ef]/70 hover:bg-[#faf6ef]/10 hover:text-[#faf6ef]"
            : "text-ink/70 hover:bg-ink/5 hover:text-ink",
        )}
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#d6409f] px-1 text-[9px] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          className={cn(
            "absolute top-full z-50 mt-2 w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-ink/10 bg-surface text-ink shadow-[0_20px_50px_-12px_rgba(16,24,5,0.35)]",
            align === "right" ? "right-0" : "left-0",
          )}
        >
          <div className="flex items-center justify-between border-b border-ink/10 px-4 py-3">
            <p className="font-serif text-sm font-extrabold">Notifications</p>
            {unread > 0 && userId && (
              <button
                onClick={() => markRead(userId)}
                className="text-[11px] font-bold text-text-tertiary transition-colors hover:text-ink cursor-pointer"
              >
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {shown.length === 0 ? (
              <div className="px-4 py-10 text-center">
                <Bell className="mx-auto h-6 w-6 text-ink/20" />
                <p className="mt-2 text-[13px] font-medium text-text-tertiary">No notifications yet</p>
              </div>
            ) : (
              shown.map((n) => (
                <button
                  key={n.id}
                  onClick={() => go(n.href)}
                  className={cn(
                    "flex w-full items-start gap-3 border-b border-ink/5 px-4 py-3 text-left transition-colors hover:bg-ink/[0.03] cursor-pointer",
                    !n.read && "bg-[#f2a3df]/[0.06]",
                  )}
                >
                  <span
                    className={cn(
                      "mt-1.5 h-2 w-2 shrink-0 rounded-full",
                      n.read ? "bg-transparent" : "bg-[#d6409f]",
                    )}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13px] font-bold leading-snug">{n.title}</span>
                    {n.body && (
                      <span className="mt-0.5 block text-[12px] leading-snug text-text-secondary">{n.body}</span>
                    )}
                    <span className="mt-1 block text-[11px] text-text-tertiary">{timeAgo(n.createdAt)}</span>
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
