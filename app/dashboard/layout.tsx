"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  Bell,
  Briefcase,
  Compass,
  CreditCard,
  FileText,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Search,
  User,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { useSession } from "@/lib/store/session";
import { useApp, useHydrated } from "@/lib/store/app";
import { Logo } from "@/components/shared/logo";
import { Avatar } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { ToastViewport } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { creatorById, companyById } from "@/lib/seed";
import { daysAgo } from "@/lib/format";
import { cn } from "@/lib/utils";
import { CommandPalette } from "@/components/company/command-palette";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

const creatorNav: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: BarChart3 },
  { href: "/dashboard/gigs", label: "Gigs", icon: Briefcase },
  { href: "/dashboard/messages", label: "Messages", icon: MessageSquare },
  { href: "/dashboard/profile", label: "Profile", icon: User },
  { href: "/dashboard/wallet", label: "Wallet", icon: Wallet },
];

const companyNav: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/discover", label: "Discover", icon: Compass },
  { href: "/dashboard/messages", label: "Messages", icon: MessageSquare },
  { href: "/dashboard/scripts", label: "Scripts", icon: FileText },
  { href: "/dashboard/billing", label: "Billing", icon: CreditCard },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const hydrated = useHydrated();
  const router = useRouter();
  const pathname = usePathname();
  const { userId, role, onboarded, signOut } = useSession();
  const notifications = useApp((s) => s.notifications);
  const markRead = useApp((s) => s.markNotificationsRead);
  const [bellOpen, setBellOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);

  useEffect(() => {
    if (hydrated && !userId) router.replace("/login");
    if (hydrated && userId && !onboarded)
      router.replace(role === "creator" ? "/onboarding/creator" : "/onboarding/company");
  }, [hydrated, userId, onboarded, role, router]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setPaletteOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (!hydrated || !userId || !role) {
    return (
      <div className="flex min-h-screen">
        <div className="hidden w-56 border-r border-border p-4 md:block">
          <Skeleton className="h-7 w-28 mb-8" />
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-9 w-full mb-2" />
          ))}
        </div>
        <div className="flex-1 p-6 space-y-4">
          <Skeleton className="h-10 w-64" />
          <div className="grid gap-4 md:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-40" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const nav = role === "creator" ? creatorNav : companyNav;
  const me = role === "creator" ? creatorById(userId) : undefined;
  const myCompany = role === "company" ? companyById(userId) : undefined;
  const displayName = me?.name ?? myCompany?.name ?? "You";
  const avatarHue = me?.avatarHue ?? myCompany?.logoHue ?? 200;
  const myNotifs = notifications.filter((n) => n.userId === userId);
  const unread = myNotifs.filter((n) => !n.read).length;

  return (
    <div className="flex min-h-screen w-full">
      {role === "company" && <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />}
      {/* Sidebar — desktop */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-56 flex-col border-r border-border bg-bg md:flex">
        <div className="px-5 py-5">
          <Link href="/dashboard" className="flex items-center gap-2 font-serif text-lg font-semibold">
            <span className="flex h-7 w-7 items-center justify-center rounded-[8px] bg-text-primary font-sans text-[11px] font-bold text-bg">M</span>
            MCC
          </Link>
        </div>
        <nav className="flex-1 space-y-1 px-3">
          {nav.map((item) => {
            const active =
              item.href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2.5 rounded-[8px] px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-surface-2 text-text-primary"
                    : "text-text-secondary hover:bg-surface-2/60 hover:text-text-primary",
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-border p-3">
          <div className="flex items-center gap-2.5 rounded-[8px] px-2 py-2">
            <Avatar name={displayName} hue={avatarHue} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-medium">{displayName}</p>
              <p className="text-[11px] capitalize text-text-tertiary">{role}</p>
            </div>
            <button
              onClick={() => {
                signOut();
                router.push("/");
              }}
              className="rounded p-1.5 text-text-tertiary hover:bg-surface-2 hover:text-text-primary cursor-pointer"
              aria-label="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex min-h-screen flex-1 flex-col md:pl-56">
        {/* Top bar */}
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between gap-3 border-b border-border bg-bg/80 px-4 backdrop-blur-sm md:px-6">
          <Link href="/dashboard" className="font-serif text-base font-semibold md:hidden">
            MCC
          </Link>
          <div className="hidden md:block">
            {role === "company" && (
              <button
                onClick={() => setPaletteOpen(true)}
                className="flex w-64 items-center gap-2 rounded-[8px] border border-border bg-surface px-3 py-1.5 text-[13px] text-text-tertiary transition-colors hover:border-border-bright cursor-pointer"
              >
                <Search className="h-3.5 w-3.5" />
                Search creators…
                <kbd className="num ml-auto rounded border border-border bg-surface-2 px-1.5 text-[10px]">⌘K</kbd>
              </button>
            )}
          </div>
          <div className="relative flex items-center gap-1">
            <button
              onClick={() => {
                setBellOpen((o) => !o);
                if (!bellOpen) markRead(userId);
              }}
              className="relative rounded-full p-2 text-text-secondary transition-colors hover:bg-surface-2 hover:text-text-primary cursor-pointer"
              aria-label="Notifications"
            >
              <Bell className="h-[18px] w-[18px]" />
              {unread > 0 && (
                <span className="num absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-ai px-1 text-[10px] font-semibold text-white">
                  {unread}
                </span>
              )}
            </button>
            {bellOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setBellOpen(false)} />
                <div className="absolute right-0 top-11 z-50 w-[min(92vw,360px)] rounded-[12px] border border-border bg-surface shadow-lg">
                  <div className="border-b border-border px-4 py-3 text-sm font-medium">Notifications</div>
                  <div className="max-h-80 overflow-y-auto">
                    {myNotifs.length === 0 ? (
                      <p className="px-4 py-8 text-center text-[13px] text-text-tertiary">
                        Nothing yet. Activity on your gigs lands here.
                      </p>
                    ) : (
                      myNotifs.slice(0, 8).map((n) => (
                        <Link
                          key={n.id}
                          href={n.href ?? "#"}
                          onClick={() => setBellOpen(false)}
                          className="block border-b border-border px-4 py-3 transition-colors last:border-0 hover:bg-surface-2/60"
                        >
                          <p className="text-[13px] font-medium">{n.title}</p>
                          <p className="mt-0.5 text-xs leading-relaxed text-text-secondary">{n.body}</p>
                          <p className="num mt-1 text-[11px] text-text-tertiary">{daysAgo(n.createdAt)}</p>
                        </Link>
                      ))
                    )}
                  </div>
                </div>
              </>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="hidden text-xs lg:inline-flex"
              onClick={() => {
                const next = role === "creator" ? "company" : "creator";
                useSession.getState().signInDemo(next);
                router.push("/dashboard");
              }}
            >
              View as {role === "creator" ? "brand" : "creator"}
            </Button>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 pb-24 md:px-6 md:pb-8">{children}</main>
      </div>

      {/* Bottom nav — mobile */}
      <nav className="fixed inset-x-0 bottom-0 z-30 flex border-t border-border bg-bg/95 backdrop-blur-sm md:hidden">
        {nav.map((item) => {
          const active =
            item.href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium",
                active ? "text-text-primary" : "text-text-tertiary",
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <ToastViewport />
    </div>
  );
}
