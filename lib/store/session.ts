"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Role } from "@/lib/types";
import { DEMO_COMPANY_ID, DEMO_CREATOR_ID } from "@/lib/seed";

interface SessionState {
  userId: string | null;
  role: Role | null;
  onboarded: boolean;
  /** Demo sign-in: binds the session to the seeded demo creator/company. */
  signInDemo: (role: Role, opts?: { onboarded?: boolean }) => void;
  completeOnboarding: () => void;
  signOut: () => void;
}

export const useSession = create<SessionState>()(
  persist(
    (set) => ({
      userId: null,
      role: null,
      onboarded: false,
      signInDemo: (role, opts) =>
        set({
          role,
          userId: role === "creator" ? DEMO_CREATOR_ID : DEMO_COMPANY_ID,
          onboarded: opts?.onboarded ?? true,
        }),
      completeOnboarding: () => set({ onboarded: true }),
      signOut: () => set({ userId: null, role: null, onboarded: false }),
    }),
    { name: "mcc-session", version: 1 },
  ),
);
