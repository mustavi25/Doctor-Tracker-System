import { Suspense } from "react";
import type { Metadata } from "next";
import { DoctorsSkeleton } from "@/components/doctors/doctors-skeleton";
import { DoctorsView } from "@/components/doctors/doctors-view";

export const metadata: Metadata = { title: "Doctors" };

export default function DoctorsPage() {
  // useSearchParams() (filters live in the URL) must sit under Suspense with Cache Components
  return (
    <Suspense fallback={<DoctorsSkeleton />}>
      <DoctorsView />
    </Suspense>
  );
}
