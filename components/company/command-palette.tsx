"use client";

import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import { Compass, FileText, MessageSquare, Search, Sparkles, User } from "lucide-react";
import { useApp } from "@/lib/store/app";
import { Avatar } from "@/components/ui/avatar";
import { TierBadge } from "@/components/shared/tier-badge";
import { formatMoney } from "@/lib/format";

/** Cmd+K — searches creators and jumps to company surfaces. */
export function CommandPalette({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const router = useRouter();
  const creators = useApp((s) => s.creators);

  const go = (href: string) => {
    onOpenChange(false);
    router.push(href);
  };

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-[60] bg-text-primary/20 backdrop-blur-[2px]"
        onClick={() => onOpenChange(false)}
      />
      <div className="fixed left-1/2 top-[18vh] z-[70] w-[min(92vw,560px)] -translate-x-1/2">
        <Command
          label="Search creators"
          className="overflow-hidden rounded-[12px] border border-border bg-surface shadow-xl"
        >
          <div className="flex items-center gap-2 border-b border-border px-4">
            <Search className="h-4 w-4 shrink-0 text-text-tertiary" />
            <Command.Input
              autoFocus
              placeholder="Search creators, niches, pages…"
              className="h-12 w-full bg-transparent text-sm outline-none placeholder:text-text-tertiary"
            />
            <kbd className="num rounded border border-border bg-surface-2 px-1.5 py-0.5 text-[10px] text-text-tertiary">esc</kbd>
          </div>
          <Command.List className="max-h-[340px] overflow-y-auto p-2">
            <Command.Empty className="px-4 py-8 text-center text-[13px] text-text-tertiary">
              No matches. Try a niche like “beauty” or “SaaS”.
            </Command.Empty>
            <Command.Group heading="Go to" className="px-2 py-1 text-[11px] font-medium uppercase tracking-wider text-text-tertiary [&_[cmdk-group-items]]:mt-1">
              {[
                { label: "Discover creators", href: "/dashboard/discover", icon: Compass },
                { label: "Messages", href: "/dashboard/messages", icon: MessageSquare },
                { label: "Script library", href: "/dashboard/scripts", icon: FileText },
                { label: "New AI script", href: "/dashboard/scripts?new=1", icon: Sparkles },
              ].map((item) => (
                <Command.Item
                  key={item.href}
                  onSelect={() => go(item.href)}
                  className="flex cursor-pointer items-center gap-2.5 rounded-[8px] px-2.5 py-2 text-sm text-text-primary data-[selected=true]:bg-surface-2"
                >
                  <item.icon className="h-4 w-4 text-text-tertiary" />
                  {item.label}
                </Command.Item>
              ))}
            </Command.Group>
            <Command.Group heading="Creators" className="px-2 py-1 text-[11px] font-medium uppercase tracking-wider text-text-tertiary [&_[cmdk-group-items]]:mt-1">
              {creators.map((c) => (
                <Command.Item
                  key={c.id}
                  value={`${c.name} ${c.handle} ${c.niches.join(" ")}`}
                  onSelect={() => go(`/creator/${c.handle}`)}
                  className="flex cursor-pointer items-center gap-2.5 rounded-[8px] px-2.5 py-2 text-sm data-[selected=true]:bg-surface-2"
                >
                  <Avatar name={c.name} hue={c.avatarHue} src={c.avatarUrl} size="xs" />
                  <span className="font-medium">{c.name}</span>
                  <span className="text-text-tertiary">@{c.handle}</span>
                  <span className="ml-auto flex items-center gap-2">
                    <TierBadge tier={c.tier} />
                    <span className="num text-xs text-text-secondary">{formatMoney(c.baseRateCents)}</span>
                  </span>
                </Command.Item>
              ))}
            </Command.Group>
            <Command.Item
              value="profile-fallback"
              onSelect={() => go("/dashboard/discover")}
              className="hidden"
            >
              <User className="h-4 w-4" />
            </Command.Item>
          </Command.List>
        </Command>
      </div>
    </>
  );
}
