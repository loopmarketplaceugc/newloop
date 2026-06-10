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
import { Avatar } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { ToastViewport } from "@/components/ui/toast";
import { companyById } from "@/lib/seed";
import { fetchCreators, fetchMyWorld } from "@/lib/sync";
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
  const { userId, role, name, onboarded, isDemo, signOut } = useSession();
  const creators = useApp((s) => s.creators);
  const notifications = useApp((s) => s.notifications);
  const enterLiveMode = useApp((s) => s.enterLiveMode);
  const setCreatorsFromDb = useApp((s) => s.setCreatorsFromDb);
  const setLiveWorld = useApp((s) => s.setLiveWorld);
  const markRead = useApp((s) => s.markNotificationsRead);
  const ensureCreator = useApp((s) => s.ensureCreator);
  const [bellOpen, setBellOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);

  useEffect(() => {
    if (hydrated && !userId) router.replace("/login");
    if (hydrated && userId && !onboarded)
      router.replace(role === "creator" ? "/onboarding/creator" : "/onboarding/company");
  }, [hydrated, userId, onboarded, role, router]);

  // Real creator accounts get a clean local record (zeros, not fake stats)
  useEffect(() => {
    if (hydrated && userId && role === "creator" && !isDemo) {
      ensureCreator(userId, name ? { name } : undefined);
    }
  }, [hydrated, userId, role, isDemo, name, ensureCreator]);

  useEffect(() => {
    if (!hydrated || !userId || isDemo) return;
    let cancelled = false;

    enterLiveMode();
    const loadLiveData = async () => {
      const [creatorRows, world] = await Promise.all([fetchCreators(), fetchMyWorld()]);
      if (cancelled) return;
      setCreatorsFromDb(creatorRows);
      if (world) setLiveWorld(world);
    };

    void loadLiveData();
    const timer = window.setInterval(() => void loadLiveData(), 3000);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [enterLiveMode, hydrated, isDemo, setCreatorsFromDb, setLiveWorld, userId]);

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
        <div className="hidden w-60 bg-ink p-5 md:block">
          <Skeleton className="h-7 w-28 mb-8 bg-[#faf6ef]/10" />
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-10 w-full mb-2 bg-[#faf6ef]/10" />
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
  const me = role === "creator" ? creators.find((c) => c.id === userId) : undefined;
  const myCompany = role === "company" && isDemo ? companyById(userId) : undefined;
  const displayName = name || me?.name || myCompany?.name || "You";
  const avatarHue = me?.avatarHue ?? myCompany?.logoHue ?? 285;
  const myNotifs = notifications.filter((n) => n.userId === userId);
  const unread = myNotifs.filter((n) => !n.read).length;

  return (
    <div className="flex min-h-screen w-full">
      {role === "company" && <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />}

      {/* Sidebar — ink */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col bg-ink text-[#faf6ef] md:flex">
        <div className="px-5 py-6">
          <Link href="/dashboard" className="font-serif text-2xl font-extrabold text-[#f2a3df]">
            MCC<span className="align-super text-[10px]">®</span>
          </Link>
          {isDemo && (
            <span className="sticker mt-2 inline-block bg-[#a8d98a] text-[11px] text-ink">demo mode</span>
          )}
        </div>
        <nav className="flex-1 space-y-1.5 px-3">
          {nav.map((item) => {
            const active =
              item.href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-full px-4 py-2.5 font-serif text-[15px] font-bold transition-all",
                  active
                    ? "bg-[#f2a3df] text-ink"
                    : "text-[#faf6ef]/60 hover:bg-[#faf6ef]/10 hover:text-[#faf6ef]",
                )}
              >
                <item.icon className="h-[18px] w-[18px]" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t-2 border-[#faf6ef]/10 p-4">
          <div className="flex items-center gap-3">
            <Avatar name={displayName} hue={avatarHue} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-bold">{displayName}</p>
              <p className="text-[11px] font-medium capitalize text-[#faf6ef]/40">{role}</p>
            </div>
            <button
              onClick={() => {
                signOut();
                router.push("/");
              }}
              className="rounded-full p-2 text-[#faf6ef]/40 transition-colors hover:bg-[#faf6ef]/10 hover:text-[#f2a3df] cursor-pointer"
              aria-label="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex min-h-screen flex-1 flex-col md:pl-60">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-3 border-b-2 border-ink/10 bg-bg/90 px-4 backdrop-blur-md md:px-6">
          <Link href="/dashboard" className="font-serif text-xl font-extrabold md:hidden">
            MCC<span className="text-[#d6409f]">®</span>
          </Link>
          <div className="hidden md:block">
            {role === "company" && (
              <button
                onClick={() => setPaletteOpen(true)}
                className="flex w-72 items-center gap-2 rounded-full border-2 border-ink/15 bg-surface px-4 py-2 text-[13px] font-bold text-text-tertiary transition-all hover:border-ink hover:scale-[1.02] cursor-pointer"
              >
                <Search className="h-4 w-4" />
                Search creators…
                <kbd className="num ml-auto rounded-full bg-surface-2 px-2 py-0.5 text-[10px]">⌘K</kbd>
              </button>
            )}
          </div>
          <div className="relative flex items-center gap-2">
            <button
              onClick={() => {
                setBellOpen((o) => !o);
                if (!bellOpen) markRead(userId);
              }}
              className="relative rounded-full border-2 border-ink/15 p-2.5 text-text-secondary transition-all hover:border-ink hover:scale-105 cursor-pointer"
              aria-label="Notifications"
            >
              <Bell className="h-[18px] w-[18px]" />
              {unread > 0 && (
                <span className="num absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#d6409f] px-1 text-[10px] font-bold text-white">
                  {unread}
                </span>
              )}
            </button>
            {bellOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setBellOpen(false)} />
                <div className="absolute right-0 top-12 z-50 w-[min(92vw,380px)] overflow-hidden rounded-[20px] border-[3px] border-ink bg-surface shadow-[6px_6px_0_0_#101805]">
                  <div className="border-b-2 border-ink/10 px-5 py-3 font-serif text-base font-bold">
                    Notifications
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {myNotifs.length === 0 ? (
                      <p className="px-5 py-10 text-center text-[13px] font-medium text-text-tertiary">
                        Nothing yet. Activity on your gigs lands here.
                      </p>
                    ) : (
                      myNotifs.slice(0, 8).map((n) => (
                        <Link
                          key={n.id}
                          href={n.href ?? "#"}
                          onClick={() => setBellOpen(false)}
                          className="block border-b border-ink/10 px-5 py-3.5 transition-colors last:border-0 hover:bg-surface-2"
                        >
                          <p className="text-[13px] font-bold">{n.title}</p>
                          <p className="mt-0.5 text-xs leading-relaxed text-text-secondary">{n.body}</p>
                          <p className="num mt-1 text-[11px] text-text-tertiary">{daysAgo(n.createdAt)}</p>
                        </Link>
                      ))
                    )}
                  </div>
                </div>
              </>
            )}
            {isDemo && (
              <button
                className="hidden rounded-full border-2 border-ink/15 px-4 py-2 text-xs font-bold transition-all hover:border-ink hover:scale-105 lg:inline-flex cursor-pointer"
                onClick={() => {
                  const next = role === "creator" ? "company" : "creator";
                  useSession.getState().signInDemo(next);
                  router.push("/dashboard");
                }}
              >
                View as {role === "creator" ? "brand" : "creator"}
              </button>
            )}
          </div>
        </header>

        <main className="flex-1 px-4 py-6 pb-28 md:px-6 md:pb-10">{children}</main>
      </div>

      {/* Bottom nav — mobile */}
      <nav className="fixed inset-x-0 bottom-0 z-30 flex bg-ink md:hidden">
        {nav.map((item) => {
          const active =
            item.href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 py-3 text-[10px] font-bold",
                active ? "text-[#f2a3df]" : "text-[#faf6ef]/40",
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
