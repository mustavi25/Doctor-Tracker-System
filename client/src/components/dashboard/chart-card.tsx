interface ChartCardProps {
  title: string;
  description?: string;
  /** Controls shown at the right of the header (tabs etc.) */
  actions?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}

export function ChartCard({ title, description, actions, className = "", children }: ChartCardProps) {
  return (
    <section className={`rounded-xl border bg-card p-5 shadow-sm ${className}`} aria-label={title}>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-0.5">
          <h2 className="font-semibold tracking-tight">{title}</h2>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
        {actions}
      </div>
      {children}
    </section>
  );
}

export function ChartPlaceholder({ height = 260 }: { height?: number }) {
  return <div className="animate-pulse rounded-lg bg-muted/60" style={{ height }} aria-hidden />;
}

export function ChartEmpty({ message, height = 260 }: { message: string; height?: number }) {
  return (
    <div className="flex items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground" style={{ height }}>
      {message}
    </div>
  );
}
