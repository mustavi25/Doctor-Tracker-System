import { ChartCard, ChartEmpty } from "./chart-card";
import { formatNumber } from "@/lib/chart";
import type { DashboardStats } from "@/types";

/** Lightweight CSS bars (no chart library needed for a simple ranked list) */
export function SpecializationsCard({ stats }: { stats: DashboardStats }) {
  const rows = stats.doctorsBySpecialization;
  const max = Math.max(1, ...rows.map((r) => r.count));

  return (
    <ChartCard title="Doctors by specialization" description={`${formatNumber(stats.totals.doctors)} doctors in total`}>
      {rows.length === 0 ? (
        <ChartEmpty message="No doctors yet" />
      ) : (
        <ul className="space-y-3">
          {rows.slice(0, 8).map((r) => (
            <li key={r.specialization} className="space-y-1.5">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="truncate">{r.specialization}</span>
                <span className="tabular-nums text-muted-foreground">{formatNumber(r.count)}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-primary" style={{ width: `${(r.count / max) * 100}%` }} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </ChartCard>
  );
}
