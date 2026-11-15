"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { cn } from "@/lib/utils";
import {
  AXIS_TICK,
  CATEGORY_COLORS,
  GRID_STROKE,
  PRIMARY,
  TOOLTIP_STYLE,
  formatLongDate,
  formatNumber,
  formatShortDate,
  truncate,
} from "@/lib/chart";
import { ChartCard, ChartEmpty } from "./chart-card";
import type { DashboardStats } from "@/types";

// ---------------------------------------------------------------------------
// Patients / doctors over time (area chart with a small tab switch)
// ---------------------------------------------------------------------------
export function OverTimeChart({ stats }: { stats: DashboardStats }) {
  const [series, setSeries] = useState<"patients" | "doctors">("patients");
  const gradientId = useId().replace(/:/g, "");
  const data = series === "patients" ? stats.patientsOverTime : stats.doctorsOverTime;
  const total = data.reduce((sum, d) => sum + d.count, 0);
  const label = series === "patients" ? "Patients" : "Doctors";

  return (
    <ChartCard
      title="New registrations"
      description={`${formatNumber(total)} new ${series} in the last ${stats.rangeDays} days`}
      className="lg:col-span-2"
      actions={
        <div role="group" aria-label="Series" className="inline-flex rounded-lg bg-muted p-0.5 text-sm">
          {(["patients", "doctors"] as const).map((s) => (
            <button
              key={s}
              type="button"
              aria-pressed={series === s}
              onClick={() => setSeries(s)}
              className={cn(
                "rounded-md px-3 py-1 font-medium capitalize transition-colors",
                series === s ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {s}
            </button>
          ))}
        </div>
      }
    >
      {total === 0 ? (
        <ChartEmpty message={`No new ${series} in this period`} />
      ) : (
        <div role="img" aria-label={`Area chart of new ${series} per day over the last ${stats.rangeDays} days, ${total} in total`} className="h-65">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={PRIMARY} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={PRIMARY} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={GRID_STROKE} />
              <XAxis dataKey="date" tickFormatter={formatShortDate} tick={AXIS_TICK} tickLine={false} axisLine={false} minTickGap={28} />
              <YAxis allowDecimals={false} tick={AXIS_TICK} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={TOOLTIP_STYLE}
                labelFormatter={(value) => formatLongDate(String(value))}
                formatter={(value) => [formatNumber(Number(value)), label]}
              />
              <Area type="monotone" dataKey="count" stroke={PRIMARY} strokeWidth={2} fill={`url(#${gradientId})`} activeDot={{ r: 4 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </ChartCard>
  );
}

// ---------------------------------------------------------------------------
// Patients per doctor (horizontal bars; click a bar to open that doctor)
// ---------------------------------------------------------------------------
export function PatientsPerDoctorChart({ stats }: { stats: DashboardStats }) {
  const router = useRouter();
  const rows = stats.patientsPerDoctor;
  const height = Math.max(220, rows.length * 38 + 16);

  return (
    <ChartCard
      title="Patients per doctor"
      description={rows.length ? `Top ${rows.length} doctors by patient count. Click a bar to open the doctor.` : undefined}
      className="lg:col-span-2"
    >
      {rows.length === 0 ? (
        <ChartEmpty message="No patients assigned yet" />
      ) : (
        <div role="img" aria-label={`Bar chart of patients per doctor. Highest: ${rows[0].name} with ${rows[0].count}`} style={{ height }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={rows} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={GRID_STROKE} />
              <XAxis type="number" allowDecimals={false} tick={AXIS_TICK} tickLine={false} axisLine={false} />
              <YAxis
                type="category"
                dataKey="name"
                width={128}
                tick={AXIS_TICK}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v: string) => truncate(v, 20)}
              />
              <Tooltip
                cursor={{ fill: "var(--muted, #f3f4f6)", opacity: 0.6 }}
                contentStyle={TOOLTIP_STYLE}
                formatter={(value) => [formatNumber(Number(value)), "Patients"]}
              />
              <Bar
                dataKey="count"
                fill={PRIMARY}
                radius={[0, 6, 6, 0]}
                barSize={20}
                cursor="pointer"
                onClick={(entry) => {
                  const id = (entry as { payload?: { doctorId?: string } }).payload?.doctorId;
                  if (id) router.push(`/doctors/${id}`);
                }}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </ChartCard>
  );
}

// ---------------------------------------------------------------------------
// Condition breakdown (donut + legend)
// ---------------------------------------------------------------------------
export function ConditionsChart({ stats }: { stats: DashboardStats }) {
  const rows = stats.conditionBreakdown;
  const shown = rows.reduce((sum, r) => sum + r.count, 0);
  const total = stats.totals.patients || shown;

  return (
    <ChartCard title="Top conditions" description="Share of all patients">
      {rows.length === 0 ? (
        <ChartEmpty message="No patient data yet" />
      ) : (
        <div className="space-y-4">
          <div
            role="img"
            aria-label={`Donut chart of conditions. Most common: ${rows[0].condition} with ${rows[0].count} patients`}
            className="relative h-48"
          >
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={rows} dataKey="count" nameKey="condition" innerRadius={58} outerRadius={84} paddingAngle={2} stroke="none">
                  {rows.map((r, i) => (
                    <Cell key={r.condition} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(value, name) => [formatNumber(Number(value)), String(name)]} />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-semibold tabular-nums">{formatNumber(total)}</span>
              <span className="text-xs text-muted-foreground">patients</span>
            </div>
          </div>

          <ul className="space-y-2 text-sm">
            {rows.map((r, i) => (
              <li key={r.condition} className="flex items-center gap-2">
                <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }} aria-hidden />
                <span className="min-w-0 flex-1 truncate">{r.condition}</span>
                <span className="tabular-nums text-muted-foreground">{formatNumber(r.count)}</span>
                <span className="w-10 text-right tabular-nums text-muted-foreground">{Math.round((r.count / total) * 100)}%</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </ChartCard>
  );
}
