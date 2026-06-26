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
import { Loader } from "@/components/shared/loader";
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
  { href: "/dashboard/opportunities", label: "Opportunities", icon: Compass },
  { href: "/dashboard/profile", label: "Profile", icon: User },
  { href: "/dashboard/wallet", label: "Wallet", icon: Wallet },
];

const companyNav: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/discover", label: "Discover", icon: Compass },
  { href: "/dashboard/requests", label: "Requests", icon: FileText },
  { href: "/dashboard/messages", label: "Messages", icon: MessageSquare },
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

  // Role-based route guards — redirect to dashboard root if wrong role accesses a locked page.
  useEffect(() => {
    if (!hydrated || !userId || !role) return;
    const CREATOR_ONLY = ["/dashboard/profile", "/dashboard/wallet", "/dashboard/opportunities"];
    const COMPANY_ONLY = ["/dashboard/discover", "/dashboard/billing", "/dashboard/requests"];
    if (role === "company" && CREATOR_ONLY.some((p) => pathname.startsWith(p))) {
      router.replace("/dashboard");
    }
    if (role === "creator" && COMPANY_ONLY.some((p) => pathname.startsWith(p))) {
      router.replace("/dashboard");
    }
  }, [hydrated, userId, role, pathname, router]);

  useEffect(() => {
    if (hydrated && userId && role === "creator" && !isDemo) {
      ensureCreator(userId, name ? { name } : undefined);
    }
  }, [hydrated, userId, role, isDemo, name, ensureCreator]);

  useEffect(() => {
    if (!hydrated || !userId || isDemo) return;
    let cancelled = false;

    enterLiveMode();
    if (role === "creator") ensureCreator(userId, name ? { name } : undefined);
    const loadLiveData = async () => {
      try {
        const [creatorRows, world] = await Promise.all([fetchCreators(), fetchMyWorld()]);
        if (cancelled) return;
        setCreatorsFromDb(creatorRows);
        if (world) setLiveWorld(world);
      } catch {
        // Supabase may be temporarily unreachable (project wake-up, network blip).
        // The app continues to work from local Zustand state.
      }
    };

    void loadLiveData();
    const timer = window.setInterval(() => void loadLiveData(), 3000);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [enterLiveMode, ensureCreator, hydrated, isDemo, name, role, setCreatorsFromDb, setLiveWorld, userId]);

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
        <div className="hidden w-60 flex-col bg-ink p-5 md:flex">
          <span className="mb-10 font-serif text-2xl font-extrabold text-[#f2a3df]">
            loop
          </span>
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="mb-2 h-10 w-full bg-[#faf6ef]/10" />
          ))}
        </div>
        <div className="flex flex-1 items-center justify-center p-6">
          <Loader label="Loading your studio" />
        </div>
      </div>
    );
  }

  const nav = role === "creator" ? creatorNav : companyNav;
  const me = role === "creator" ? creators.find((c) => c.id === userId) : undefined;
  const myCompany = role === "company" && isDemo ? companyById(userId) : undefined;
  const displayName = name || me?.name || myCompany?.name || "You";
  const avatarHue = me?.avatarHue ?? myCompany?.logoHue ?? 285;
  const avatarUrl = me?.avatarUrl;
  const myNotifs = notifications.filter((n) => n.userId === userId);
  const unread = myNotifs.filter((n) => !n.read).length;

  return (
    <div className="flex min-h-screen w-full">
      {role === "company" && <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />}

      {/* Sidebar — ink */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col bg-ink text-[#faf6ef] md:flex">
        <div className="px-5 py-6">
          <Link href="/dashboard" className="font-serif text-2xl font-extrabold text-[#f2a3df]">
            loop
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
            <Avatar name={displayName} hue={avatarHue} src={avatarUrl} size="sm" />
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
        <main className="flex-1 px-4 py-4 pb-28 md:px-6 md:pb-10">{children}</main>
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
