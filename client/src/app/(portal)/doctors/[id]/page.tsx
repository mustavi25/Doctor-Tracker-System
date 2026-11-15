import { Suspense } from "react";
import type { Metadata } from "next";
import { DoctorDetailSkeleton } from "@/components/doctors/doctor-detail-skeleton";
import { DoctorDetailView } from "@/components/doctors/doctor-detail-view";

export const metadata: Metadata = { title: "Doctor details" };

// `params` is runtime data, so with Cache Components it must be awaited inside <Suspense>
async function DoctorDetailLoader({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <DoctorDetailView id={id} />;
}

export default function DoctorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<DoctorDetailSkeleton />}>
      <DoctorDetailLoader params={params} />
    </Suspense>
  );
}
