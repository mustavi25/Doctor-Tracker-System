"use client";

import dynamic from "next/dynamic";
import { Activity, AlertCircle, Stethoscope, UserPlus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { ChartCard, ChartPlaceholder } from "./chart-card";
import { DashboardSkeleton } from "./dashboard-skeleton";
import { RangeSelector } from "./range-selector";
import { SpecializationsCard } from "./specializations-card";
import { StatCard } from "./stat-card";
import { parseRange, useDashboardStats } from "@/hooks/use-dashboard";
import { useUrlState } from "@/hooks/use-url-state";
import { getErrorMessage } from "@/lib/api";
import { formatNumber } from "@/lib/chart";

// Recharts is the heaviest dependency: load it only on this page, only in the browser
const loading = () => (
  <ChartCard title="Loading chart">
    <ChartPlaceholder />
  </ChartCard>
);
const OverTimeChart = dynamic(() => import("./charts").then((m) => m.OverTimeChart), { ssr: false, loading });
const PatientsPerDoctorChart = dynamic(() => import("./charts").then((m) => m.PatientsPerDoctorChart), { ssr: false, loading });
const ConditionsChart = dynamic(() => import("./charts").then((m) => m.ConditionsChart), { ssr: false, loading });

export function DashboardView() {
  const { searchParams, update } = useUrlState();
  const days = parseRange(searchParams.get("days"));
  const { data, isLoading, isFetching, isError, error, refetch } = useDashboardStats(days);

  if (isLoading) return <DashboardSkeleton />;

  if (isError || !data) {
    return (
      <>
        <PageHeader title="Dashboard" description="Overview of doctors, patients and activity." />
        <div className="rounded-xl border bg-card shadow-sm" role="alert">
          <EmptyState
            icon={AlertCircle}
            title="Couldn't load the dashboard"
            description={getErrorMessage(error)}
            action={
              <Button type="button" variant="outline" onClick={() => refetch()}>
                Try again
              </Button>
            }
          />
        </div>
      </>
    );
  }

  const { totals } = data;
  const newInRange = data.patientsOverTime.reduce((sum, d) => sum + d.count, 0);

  return (
    <div aria-busy={isFetching}>
      <PageHeader
        title="Dashboard"
        description="Overview of doctors, patients and activity."
        actions={<RangeSelector value={days} onChange={(d) => update({ days: d === 30 ? null : d })} />}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total doctors"
          value={formatNumber(totals.doctors)}
          icon={Stethoscope}
          hint={`+${formatNumber(totals.newDoctorsThisWeek)} this week`}
          positive={totals.newDoctorsThisWeek > 0}
        />
        <StatCard
          label="Total patients"
          value={formatNumber(totals.patients)}
          icon={Users}
          hint={`+${formatNumber(totals.newPatientsThisWeek)} this week`}
          positive={totals.newPatientsThisWeek > 0}
        />
        <StatCard label="Avg. patients per doctor" value={String(totals.avgPatientsPerDoctor)} icon={Activity} hint="Across all doctors" />
        <StatCard label={`New patients (${days} days)`} value={formatNumber(newInRange)} icon={UserPlus} hint={`Last ${days} days`} />
      </div>

      <div className={`mt-4 grid gap-4 transition-opacity lg:grid-cols-3 ${isFetching ? "opacity-70" : ""}`}>
        <OverTimeChart stats={data} />
        <ConditionsChart stats={data} />
        <PatientsPerDoctorChart stats={data} />
        <SpecializationsCard stats={data} />
      </div>
    </div>
  );
}
