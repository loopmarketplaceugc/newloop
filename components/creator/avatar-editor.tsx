"use client";

import { useRef, useState } from "react";
import { Camera, Check, Trash2, Upload } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

/** A handful of ready-to-use demo portraits (randomuser.me — allowed by next.config remotePatterns). */
const PRESETS: string[] = [
  ["women", 1], ["men", 5], ["women", 16], ["men", 20], ["women", 30], ["men", 36],
  ["women", 42], ["men", 48], ["women", 57], ["men", 72], ["women", 79], ["men", 91],
].map(([g, i]) => `https://randomuser.me/api/portraits/${g}/${i}.jpg`);

const MAX_BYTES = 8 * 1024 * 1024; // 8 MB raw upload ceiling
const OUTPUT_SIZE = 256; // square px — keeps the stored data URL tiny

/**
 * Read an image file, center-crop it to a square, and downscale to a small JPEG
 * data URL. Keeps avatars ~10–30 KB so they fit comfortably in localStorage / the
 * profiles.avatar_url column instead of bloating either with a multi-MB original.
 */
function fileToAvatarDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new window.Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement("canvas");
      canvas.width = OUTPUT_SIZE;
      canvas.height = OUTPUT_SIZE;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("Canvas unavailable"));
      const scale = Math.max(OUTPUT_SIZE / img.width, OUTPUT_SIZE / img.height);
      const w = img.width * scale;
      const h = img.height * scale;
      ctx.drawImage(img, (OUTPUT_SIZE - w) / 2, (OUTPUT_SIZE - h) / 2, w, h);
      resolve(canvas.toDataURL("image/jpeg", 0.82));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read that image"));
    };
    img.src = url;
  });
}

export function AvatarEditor({
  name,
  hue,
  src,
  onChange,
}: {
  name: string;
  hue: number;
  src?: string;
  /** Called with the new photo (data URL or preset URL), or `undefined` to clear it. */
  onChange: (avatarUrl: string | undefined) => void;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<string | undefined>(src);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast("Not an image", { body: "Pick a JPG, PNG, or WebP file.", tone: "warning" });
      return;
    }
    if (file.size > MAX_BYTES) {
      toast("Image too large", { body: "Please choose a file under 8 MB.", tone: "warning" });
      return;
    }
    setBusy(true);
    try {
      setDraft(await fileToAvatarDataUrl(file));
    } catch {
      toast("Upload failed", { body: "That image couldn't be processed.", tone: "warning" });
    } finally {
      setBusy(false);
    }
  };

  const save = () => {
    onChange(draft);
    setOpen(false);
    toast("Photo updated", {
      body: draft ? "Brands see your new photo immediately." : "Photo removed.",
      tone: "success",
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (next) setDraft(src); // reset the draft to the saved photo each time we open
        setOpen(next);
      }}
    >
      <DialogTrigger asChild>
        <button
          type="button"
          aria-label="Change profile photo"
          className="group relative shrink-0 cursor-pointer rounded-full outline-none focus-visible:ring-2 focus-visible:ring-text-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
        >
          <Avatar name={name} hue={hue} src={src} size="xl" />
          {/* Dim + camera on hover/focus (desktop affordance) */}
          <span className="absolute inset-0 flex items-center justify-center rounded-full bg-text-primary/40 opacity-0 backdrop-blur-[1px] transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
            <Camera className="h-5 w-5 text-white" />
          </span>
          {/* Always-visible camera badge so the control is discoverable on touch and at a glance */}
          <span className="absolute -bottom-0.5 -right-0.5 flex h-7 w-7 items-center justify-center rounded-full border-2 border-surface bg-text-primary text-bg shadow-sm transition-transform group-hover:scale-110">
            <Camera className="h-3.5 w-3.5" />
          </span>
        </button>
      </DialogTrigger>

      <DialogContent>
        <DialogTitle>Profile photo</DialogTitle>
        <DialogDescription>
          Upload your own or pick one of ours. This is what brands see on Discover and your public page.
        </DialogDescription>

        <div className="mt-5 flex items-center gap-4">
          <Avatar name={name} hue={hue} src={draft} size="xl" />
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" disabled={busy} onClick={() => fileRef.current?.click()}>
              <Upload className="h-4 w-4" /> {busy ? "Processing…" : "Upload photo"}
            </Button>
            {draft && (
              <Button
                variant="danger"
                size="sm"
                onClick={() => setDraft(undefined)}
              >
                <Trash2 className="h-4 w-4" /> Remove
              </Button>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              void handleFile(e.target.files?.[0]);
              e.target.value = ""; // allow re-selecting the same file
            }}
          />
        </div>

        <p className="mt-6 mb-2 text-[11px] font-bold uppercase tracking-wider text-text-tertiary">
          Or choose one
        </p>
        <div className="grid grid-cols-6 gap-2">
          {PRESETS.map((url) => {
            const active = draft === url;
            return (
              <button
                key={url}
                type="button"
                aria-label="Use this photo"
                onClick={() => setDraft(url)}
                className={cn(
                  "relative aspect-square overflow-hidden rounded-full ring-2 transition-all cursor-pointer hover:scale-105",
                  active ? "ring-text-primary" : "ring-transparent hover:ring-border-bright",
                )}
              >
                <Avatar name={name} hue={hue} src={url} size="lg" className="h-full w-full" />
                {active && (
                  <span className="absolute inset-0 flex items-center justify-center bg-text-primary/40">
                    <Check className="h-4 w-4 text-white" />
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button size="sm" disabled={busy} onClick={save}>
            Save photo
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
