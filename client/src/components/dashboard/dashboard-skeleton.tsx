import { PageHeader } from "@/components/layout/page-header";
import { ChartPlaceholder } from "./chart-card";
import { StatCardSkeleton } from "./stat-card";

export function DashboardSkeleton() {
  return (
    <>
      <PageHeader title="Dashboard" description="Overview of doctors, patients and activity." />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border bg-card p-5 shadow-sm lg:col-span-2">
          <ChartPlaceholder />
        </div>
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <ChartPlaceholder />
        </div>
      </div>
    </>
  );
}
