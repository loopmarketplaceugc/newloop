"use client";

import { create } from "zustand";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Info, AlertTriangle } from "lucide-react";
import { spring } from "@/lib/motion";
import { cn } from "@/lib/utils";

type ToastTone = "success" | "info" | "warning";

interface Toast {
  id: number;
  title: string;
  body?: string;
  tone: ToastTone;
}

interface ToastStore {
  toasts: Toast[];
  push: (t: Omit<Toast, "id">) => void;
  dismiss: (id: number) => void;
}

let nextId = 1;

export const useToasts = create<ToastStore>((set) => ({
  toasts: [],
  push: (t) => {
    const id = nextId++;
    set((s) => ({ toasts: [...s.toasts.slice(-2), { ...t, id }] }));
    setTimeout(() => set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) })), 4500);
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) })),
}));

export function toast(title: string, opts?: { body?: string; tone?: ToastTone }) {
  useToasts.getState().push({ title, body: opts?.body, tone: opts?.tone ?? "info" });
}

const icons: Record<ToastTone, React.ReactNode> = {
  success: <CheckCircle2 className="h-4 w-4 text-money" />,
  info: <Info className="h-4 w-4 text-text-tertiary" />,
  warning: <AlertTriangle className="h-4 w-4 text-amber" />,
};

export function ToastViewport() {
  const { toasts, dismiss } = useToasts();
  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-[min(92vw,360px)] flex-col gap-2">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.button
            key={t.id}
            layout
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0, transition: spring }}
            exit={{ opacity: 0, y: 8, transition: { duration: 0.12 } }}
            onClick={() => dismiss(t.id)}
            className={cn(
              "pointer-events-auto flex items-start gap-2.5 rounded-[12px] border border-border bg-surface p-3.5 text-left shadow-lg cursor-pointer",
            )}
          >
            <span className="mt-0.5 shrink-0">{icons[t.tone]}</span>
            <span className="min-w-0">
              <span className="block text-[13px] font-medium text-text-primary">{t.title}</span>
              {t.body ? (
                <span className="mt-0.5 block text-xs leading-relaxed text-text-secondary">
                  {t.body}
                </span>
              ) : null}
            </span>
          </motion.button>
        ))}
      </AnimatePresence>
    </div>
  );
}
