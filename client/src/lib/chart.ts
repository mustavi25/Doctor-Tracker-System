/** Distinct, colour-blind-friendly hues for categorical charts (donut) */
export const CATEGORY_COLORS = [
  "#2563eb", // blue
  "#10b981", // green
  "#f59e0b", // amber
  "#ef4444", // red
  "#8b5cf6", // violet
  "#06b6d4", // cyan
  "#ec4899", // pink
  "#64748b", // slate
] as const;

/** Single-series charts follow the app's primary colour */
export const PRIMARY = "var(--primary, #2563eb)";
export const AXIS_TICK = { fill: "var(--muted-foreground, #6b7280)", fontSize: 12 } as const;
export const GRID_STROKE = "var(--border, #e5e7eb)";

export const TOOLTIP_STYLE = {
  borderRadius: 10,
  border: "1px solid var(--border, #e5e7eb)",
  background: "var(--popover, #fff)",
  color: "var(--popover-foreground, #111827)",
  fontSize: 12,
  boxShadow: "0 8px 24px rgb(0 0 0 / 0.08)",
} as const;

// Dates from the API are "YYYY-MM-DD" (UTC buckets); format in UTC so they never shift a day
const shortDate = new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", timeZone: "UTC" });
const longDate = new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" });

export const formatShortDate = (iso: string) => shortDate.format(new Date(`${iso}T00:00:00Z`));
export const formatLongDate = (iso: string) => longDate.format(new Date(`${iso}T00:00:00Z`));
export const formatNumber = (n: number) => new Intl.NumberFormat("en-US").format(n);

export const truncate = (s: string, max = 18) => (s.length > max ? `${s.slice(0, max - 1)}…` : s);
