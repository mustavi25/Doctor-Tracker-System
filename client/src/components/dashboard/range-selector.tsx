import { cn } from "@/lib/utils";
import { RANGE_OPTIONS, type RangeDays } from "@/hooks/use-dashboard";

export function RangeSelector({ value, onChange }: { value: RangeDays; onChange: (days: RangeDays) => void }) {
  return (
    <div role="group" aria-label="Date range" className="inline-flex rounded-lg border bg-card p-0.5 shadow-sm">
      {RANGE_OPTIONS.map((days) => (
        <button
          key={days}
          type="button"
          aria-pressed={value === days}
          onClick={() => onChange(days)}
          className={cn(
            "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
            value === days ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          )}
        >
          {days}d
        </button>
      ))}
    </div>
  );
}
