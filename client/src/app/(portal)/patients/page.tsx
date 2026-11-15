import { Suspense } from "react";
import type { Metadata } from "next";
import { PatientsSkeleton } from "@/components/patients/patients-skeleton";
import { PatientsView } from "@/components/patients/patients-view";

export const metadata: Metadata = { title: "Patients" };

export default function PatientsPage() {
  // useSearchParams() (filters live in the URL) must sit under Suspense with Cache Components
  return (
    <Suspense fallback={<PatientsSkeleton />}>
      <PatientsView />
    </Suspense>
  );
}
