import { Suspense } from "react";
import type { Metadata } from "next";
import { DashboardSkeleton } from "@/components/dashboard/dashboard-skeleton";
import { DashboardView } from "@/components/dashboard/dashboard-view";

export const metadata: Metadata = { title: "Dashboard" };

export default function DashboardPage() {
  // useSearchParams() (the date range lives in the URL) must sit under Suspense with Cache Components
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardView />
    </Suspense>
  );
}
