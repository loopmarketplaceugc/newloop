"use client";

import { useMemo, useState } from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import { CountUpMoney } from "@/components/shared/count-up";
import { formatMoney, formatShortDate } from "@/lib/format";
import type { Transaction } from "@/lib/types";
import { cn } from "@/lib/utils";

const RANGES = [
  { label: "30d", days: 30 },
  { label: "90d", days: 90 },
  { label: "All", days: 365 },
] as const;

/** Earnings are derived from real release transactions — never invented. */
export function EarningsCard({ releases }: { releases: Transaction[] }) {
  const [range, setRange] = useState<(typeof RANGES)[number]>(RANGES[1]);
  const totalEarnedCents = releases.reduce((s, t) => s + t.amountCents, 0);

  const data = useMemo(() => {
    const points: { date: string; dollars: number }[] = [];
    const dayMs = 86_400_000;
    const start = Date.now() - range.days * dayMs;
    const baseline = releases
      .filter((t) => new Date(t.createdAt).getTime() < start)
      .reduce((s, t) => s + t.amountCents, 0);
    const step = Math.max(1, Math.floor(range.days / 30));
    for (let i = range.days; i >= 0; i -= step) {
      const cutoff = Date.now() - i * dayMs;
      const cumulative =
        baseline +
        releases
          .filter((t) => {
            const ts = new Date(t.createdAt).getTime();
            return ts >= start && ts <= cutoff;
          })
          .reduce((s, t) => s + t.amountCents, 0);
      points.push({ date: formatShortDate(new Date(cutoff).toISOString()), dollars: cumulative / 100 });
    }
    return points;
  }, [releases, range.days]);

  return (
    <Card className="md:col-span-2">
      <CardContent className="flex h-full flex-col">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-text-tertiary">
              Total earned
            </p>
            <CountUpMoney cents={totalEarnedCents} className="font-serif text-4xl font-extrabold sm:text-5xl" />
            {totalEarnedCents === 0 && (
              <p className="mt-1 text-xs font-medium text-text-tertiary">
                Your first escrow release lands here.
              </p>
            )}
          </div>
          <div className="flex rounded-full border-2 border-ink/15 p-0.5">
            {RANGES.map((r) => (
              <button
                key={r.label}
                onClick={() => setRange(r)}
                className={cn(
                  "num rounded-full px-3 py-1 text-xs font-bold transition-colors cursor-pointer",
                  range.label === r.label
                    ? "bg-ink text-[#a8d98a]"
                    : "text-text-tertiary hover:text-text-primary",
                )}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-4 h-44 flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="earningsFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3e7b3f" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#a8d98a" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: "#8b8f7e" }}
                minTickGap={48}
              />
              <YAxis hide domain={[0, "dataMax + 100"]} />
              <Tooltip
                cursor={{ stroke: "#101805", strokeDasharray: "3 3" }}
                content={({ active, payload, label }) =>
                  active && payload?.length ? (
                    <div className="rounded-[12px] border-2 border-ink bg-surface px-3 py-2 text-xs shadow-[3px_3px_0_0_#101805]">
                      <p className="font-bold text-text-tertiary">{label}</p>
                      <p className="num mt-0.5 font-bold text-money">
                        {formatMoney(Math.round((payload[0].value as number) * 100))}
                      </p>
                    </div>
                  ) : null
                }
              />
              <Area
                type="monotone"
                dataKey="dollars"
                stroke="#3e7b3f"
                strokeWidth={3}
                fill="url(#earningsFill)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
