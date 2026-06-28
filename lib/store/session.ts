"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Role } from "@/lib/types";
import { DEMO_COMPANY_ID, DEMO_CREATOR_ID } from "@/lib/seed";
import { supabase } from "@/lib/supabase";
import { useOnboarding } from "@/lib/store/onboarding";

interface SessionState {
  userId: string | null;
  role: Role | null;
  name: string;
  email: string;
  onboarded: boolean;
  /** true when browsing with seeded sample data instead of a real account */
  isDemo: boolean;
  signInDemo: (role: Role, opts?: { onboarded?: boolean }) => void;
  setAuthed: (p: { userId: string; role: Role; name?: string; email?: string; onboarded: boolean }) => void;
  setName: (name: string) => void;
  completeOnboarding: () => void;
  signOut: () => void;
}

export const useSession = create<SessionState>()(
  persist(
    (set) => ({
      userId: null,
      role: null,
      name: "",
      email: "",
      onboarded: false,
      isDemo: false,
      signInDemo: (role, opts) =>
        set({
          role,
          userId: role === "creator" ? DEMO_CREATOR_ID : DEMO_COMPANY_ID,
          name: "",
          email: "",
          isDemo: true,
          onboarded: opts?.onboarded ?? true,
        }),
      setAuthed: (p) =>
        set({
          userId: p.userId,
          role: p.role,
          name: p.name ?? "",
          email: p.email ?? "",
          isDemo: false,
          onboarded: p.onboarded,
        }),
      setName: (name) => set({ name }),
      completeOnboarding: () => set({ onboarded: true }),
      signOut: () => {
        void supabase().auth.signOut();
        useOnboarding.getState().reset();
        set({ userId: null, role: null, name: "", email: "", onboarded: false, isDemo: false });
      },
    }),
    { name: "loop-session", version: 2 },
  ),
);
