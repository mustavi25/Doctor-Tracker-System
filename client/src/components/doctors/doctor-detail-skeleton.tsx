/** Static shell used both as the Suspense fallback and while the doctor loads */
export function DoctorDetailSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading doctor">
      <div className="mb-4 h-5 w-36 animate-pulse rounded bg-muted" />
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="size-14 animate-pulse rounded-full bg-muted" />
          <div className="space-y-2">
            <div className="h-6 w-48 animate-pulse rounded bg-muted" />
            <div className="h-5 w-24 animate-pulse rounded-full bg-muted" />
          </div>
        </div>
        <div className="mt-6 grid gap-5 border-t pt-5 sm:grid-cols-2 lg:grid-cols-5">
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="h-10 animate-pulse rounded bg-muted" />
          ))}
        </div>
      </div>
      <div className="mt-8 space-y-px overflow-hidden rounded-xl border bg-card">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="h-14 animate-pulse border-b bg-muted/40 last:border-0" />
        ))}
      </div>
    </div>
  );
}
