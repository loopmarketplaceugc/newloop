"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CompensationPref, Niche, Platform } from "@/lib/types";

export interface OnboardingPlatform {
  enabled: boolean;
  url: string;
  followers: string; // raw input, parsed at the edge
}

interface OnboardingState {
  step: number;
  // Step 1 — identity
  name: string;
  handle: string;
  bio: string;
  location: string;
  avatarUploaded: boolean;
  // Step 2 — platforms
  platforms: Record<Platform, OnboardingPlatform>;
  // Step 3 — portfolio
  uploads: { name: string; progress: number }[];
  mediaKitName: string | null;
  // Step 4 — preferences
  niches: Niche[];
  compensation: CompensationPref;
  capacity: number;
  baseRate: number; // dollars in the UI, stored as number
  usageUpcharge: number;
  rawUpcharge: number;

  set: <K extends keyof OnboardingState>(key: K, value: OnboardingState[K]) => void;
  setPlatform: (p: Platform, partial: Partial<OnboardingPlatform>) => void;
  toggleNiche: (n: Niche) => void;
  addUpload: (name: string) => void;
  setUploadProgress: (name: string, progress: number) => void;
  reset: () => void;
}

const initial = {
  step: 1,
  name: "",
  handle: "",
  bio: "",
  location: "",
  avatarUploaded: false,
  platforms: {
    tiktok: { enabled: false, url: "", followers: "" },
    reels: { enabled: false, url: "", followers: "" },
    shorts: { enabled: false, url: "", followers: "" },
  },
  uploads: [] as { name: string; progress: number }[],
  mediaKitName: null as string | null,
  niches: [] as Niche[],
  compensation: "product_plus" as CompensationPref,
  capacity: 3,
  baseRate: 250,
  usageUpcharge: 30,
  rawUpcharge: 40,
};

/** One store for the whole wizard — each step persists on change (demo: localStorage; prod: Supabase upsert per step). */
export const useOnboarding = create<OnboardingState>()(
  persist(
    (set) => ({
      ...initial,
      set: (key, value) => set({ [key]: value } as Pick<OnboardingState, typeof key>),
      setPlatform: (p, partial) =>
        set((s) => ({ platforms: { ...s.platforms, [p]: { ...s.platforms[p], ...partial } } })),
      toggleNiche: (n) =>
        set((s) => ({
          niches: s.niches.includes(n) ? s.niches.filter((x) => x !== n) : [...s.niches, n],
        })),
      addUpload: (name) =>
        set((s) => ({ uploads: [...s.uploads, { name, progress: 0 }] })),
      setUploadProgress: (name, progress) =>
        set((s) => ({
          uploads: s.uploads.map((u) => (u.name === name ? { ...u, progress } : u)),
        })),
      reset: () => set(initial),
    }),
    { name: "loop-onboarding", version: 1 },
  ),
);

export const TAKEN_HANDLES = ["mia.creates", "dev.darius", "soph.eats", "liftwithlena", "admin", "loop"];
