import type { LucideIcon } from "lucide-react";
import { TrendingUp } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  /** Small line under the value, e.g. "+3 this week" */
  hint?: string;
  /** Highlight the hint in green (positive trend) */
  positive?: boolean;
}

export function StatCard({ label, value, icon: Icon, hint, positive }: StatCardProps) {
  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm text-muted-foreground">{label}</p>
        <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="size-4.5" aria-hidden />
        </div>
      </div>
      <p className="mt-3 text-3xl font-semibold tracking-tight tabular-nums">{value}</p>
      {hint && (
        <p className={`mt-1.5 flex items-center gap-1 text-xs ${positive ? "text-emerald-600" : "text-muted-foreground"}`}>
          {positive && <TrendingUp className="size-3.5" aria-hidden />}
          {hint}
        </p>
      )}
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm" aria-hidden>
      <div className="flex justify-between">
        <div className="h-4 w-24 animate-pulse rounded bg-muted" />
        <div className="size-9 animate-pulse rounded-lg bg-muted" />
      </div>
      <div className="mt-4 h-8 w-20 animate-pulse rounded bg-muted" />
      <div className="mt-3 h-3 w-28 animate-pulse rounded bg-muted" />
    </div>
  );
}
