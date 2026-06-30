import { creators as seededCreators } from "@/lib/seed";

/**
 * Handles of the seeded "placebo" supply creators (lib/seed.ts, mirrored into
 * the DB by the placebo migration). Real creators never collide: makeHandle()
 * always appends a random suffix, so an exact handle match is a reliable marker.
 *
 * Seeded creators are shown to brands as browsable supply, but are stripped of
 * their @handle, channel embed, and outbound profile links, and are excluded
 * from search / not directly openable.
 */
export const SEEDED_CREATOR_HANDLES: ReadonlySet<string> = new Set(
  seededCreators.map((c) => c.handle),
);

export function isSeededCreator(creator: { handle?: string | null } | null | undefined): boolean {
  return Boolean(creator?.handle && SEEDED_CREATOR_HANDLES.has(creator.handle));
}
