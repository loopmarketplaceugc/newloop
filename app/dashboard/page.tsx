"use client";

import { useSession } from "@/lib/store/session";
import { useHydrated } from "@/lib/store/app";
import { CreatorDashboard } from "@/components/creator/creator-dashboard";
import { CompanyDashboard } from "@/components/company/company-dashboard";
import { CardSkeleton } from "@/components/ui/skeleton";

export default function DashboardPage() {
  const hydrated = useHydrated();
  const role = useSession((s) => s.role);

  if (!hydrated || !role) {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    );
  }

  return role === "creator" ? <CreatorDashboard /> : <CompanyDashboard />;
}
