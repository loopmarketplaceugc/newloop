import { Loader } from "@/components/shared/loader";

export default function DashboardLoading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Loader label="Loading your studio" />
    </div>
  );
}
