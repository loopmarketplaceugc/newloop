import { Badge } from "./badge";
import { STATUS_LABELS, STATUS_TONES, type StatusToneName } from "@/lib/gig-machine";
import type { GigStatus } from "@/lib/types";

const toneToVariant: Record<StatusToneName, "default" | "money" | "amber" | "danger"> = {
  neutral: "default",
  emerald: "money",
  amber: "amber",
  danger: "danger",
};

export function StatusPill({ status }: { status: GigStatus }) {
  return <Badge variant={toneToVariant[STATUS_TONES[status]]}>{STATUS_LABELS[status]}</Badge>;
}
