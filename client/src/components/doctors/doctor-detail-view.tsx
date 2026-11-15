"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowLeft, UserX } from "lucide-react";
import { isAxiosError } from "axios";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { DoctorFormDialog } from "./doctor-form-dialog";
import { DoctorPatientsSection } from "./doctor-patients-section";
import { DoctorProfileCard } from "./doctor-profile-card";
import { DoctorDetailSkeleton } from "./doctor-detail-skeleton";
import { useDeleteDoctor, useDoctor } from "@/hooks/use-doctors";
import { getErrorMessage } from "@/lib/api";

function BackLink() {
  return (
    <Link href="/doctors" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
      <ArrowLeft className="size-4" aria-hidden /> Back to doctors
    </Link>
  );
}

export function DoctorDetailView({ id }: { id: string }) {
  const router = useRouter();
  const { data: doctor, isLoading, isError, error, refetch } = useDoctor(id);
  const deleteDoctor = useDeleteDoctor();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  if (isLoading) return <DoctorDetailSkeleton />;

  if (isError || !doctor) {
    // 404 = no such doctor, 400 = malformed id; both mean "not found" for the user
    const status = isAxiosError(error) ? error.response?.status : undefined;
    const notFound = status === 404 || status === 400;
    return (
      <>
        <BackLink />
        <div className="rounded-xl border bg-card shadow-sm" role={notFound ? undefined : "alert"}>
          {notFound ? (
            <EmptyState
              icon={UserX}
              title="Doctor not found"
              description="This doctor may have been deleted, or the link is incorrect."
              action={
                <Button type="button" variant="outline" onClick={() => router.replace("/doctors")}>
                  Go to doctors
                </Button>
              }
            />
          ) : (
            <EmptyState
              icon={AlertCircle}
              title="Couldn't load this doctor"
              description={getErrorMessage(error)}
              action={
                <Button type="button" variant="outline" onClick={() => refetch()}>
                  Try again
                </Button>
              }
            />
          )}
        </div>
      </>
    );
  }

  const confirmDelete = () =>
    deleteDoctor.mutate(doctor._id, {
      onSuccess: (res) => {
        toast.success(
          res.patientsDeleted > 0
            ? `Doctor deleted along with ${res.patientsDeleted} patient${res.patientsDeleted > 1 ? "s" : ""}`
            : "Doctor deleted"
        );
        setDeleteOpen(false);
        router.replace("/doctors");
      },
      onError: (err) => toast.error(getErrorMessage(err)),
    });

  return (
    <>
      <BackLink />
      <DoctorProfileCard doctor={doctor} onEdit={() => setEditOpen(true)} onDelete={() => setDeleteOpen(true)} />
      <DoctorPatientsSection doctorId={doctor._id} doctorName={doctor.name} />

      <DoctorFormDialog open={editOpen} doctor={doctor} onClose={() => setEditOpen(false)} />

      <ConfirmDialog
        open={deleteOpen}
        title="Delete doctor?"
        description={`${doctor.name} will be permanently removed${
          doctor.patientCount ? `, together with their ${doctor.patientCount} patient${doctor.patientCount > 1 ? "s" : ""}` : ""
        }. This can't be undone.`}
        confirmLabel="Delete"
        destructive
        loading={deleteDoctor.isPending}
        onConfirm={confirmDelete}
        onClose={() => setDeleteOpen(false)}
      />
    </>
  );
}
