"use client";

import { useMemo, useState } from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import { CountUpMoney } from "@/components/shared/count-up";
import { earningsSeries } from "@/lib/seed";
import { formatMoney, formatShortDate } from "@/lib/format";
import { cn } from "@/lib/utils";

const RANGES = [
  { label: "30d", days: 30 },
  { label: "90d", days: 90 },
  { label: "All", days: 180 },
] as const;

export function EarningsCard({ totalEarnedCents }: { totalEarnedCents: number }) {
  const [range, setRange] = useState<(typeof RANGES)[number]>(RANGES[1]);
  const data = useMemo(
    () =>
      earningsSeries(range.days).map((p) => ({
        date: formatShortDate(p.date),
        dollars: p.cumulativeCents / 100,
      })),
    [range.days],
  );

  return (
    <Card className="md:col-span-2">
      <CardContent className="flex h-full flex-col">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wider text-text-tertiary">
              Total earned
            </p>
            <CountUpMoney cents={totalEarnedCents} className="text-4xl font-semibold sm:text-5xl" />
          </div>
          <div className="flex rounded-[8px] border border-border p-0.5">
            {RANGES.map((r) => (
              <button
                key={r.label}
                onClick={() => setRange(r)}
                className={cn(
                  "num rounded-[6px] px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer",
                  range.label === r.label
                    ? "bg-surface-2 text-text-primary"
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
                  <stop offset="0%" stopColor="#3e7b5e" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#3e7b5e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: "#a8a399", fontFamily: "var(--font-mono)" }}
                minTickGap={48}
              />
              <YAxis hide domain={["dataMin - 500", "dataMax + 200"]} />
              <Tooltip
                cursor={{ stroke: "#cfc9ba", strokeDasharray: "3 3" }}
                content={({ active, payload, label }) =>
                  active && payload?.length ? (
                    <div className="rounded-[8px] border border-border bg-surface px-3 py-2 text-xs shadow-md">
                      <p className="text-text-tertiary">{label}</p>
                      <p className="num mt-0.5 font-semibold text-money">
                        {formatMoney(Math.round((payload[0].value as number) * 100))}
                      </p>
                    </div>
                  ) : null
                }
              />
              <Area
                type="monotone"
                dataKey="dollars"
                stroke="#3e7b5e"
                strokeWidth={2}
                fill="url(#earningsFill)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
