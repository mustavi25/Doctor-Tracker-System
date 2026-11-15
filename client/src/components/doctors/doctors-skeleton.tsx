import { PageHeader } from "@/components/layout/page-header";

/** Static shell shown while the client view hydrates (also the Suspense fallback) */
export function DoctorsSkeleton() {
  return (
    <>
      <PageHeader title="Doctors" description="Manage doctors and view their patients." />
      <div className="mb-4 h-24 animate-pulse rounded-xl border bg-card" />
      <div className="space-y-px overflow-hidden rounded-xl border bg-card">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="h-14 animate-pulse border-b bg-muted/40 last:border-0" />
        ))}
      </div>
    </>
  );
}
