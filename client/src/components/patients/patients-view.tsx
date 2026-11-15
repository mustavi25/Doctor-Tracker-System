"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AlertCircle, FilterX, UserRound } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { Pagination } from "@/components/shared/pagination";
import { PageHeader } from "@/components/layout/page-header";
import { PatientFilters } from "./patient-filters";
import { PatientFormDialog } from "./patient-form-dialog";
import { PatientsTable } from "./patients-table";
import { useDoctorOptions } from "@/hooks/use-doctors";
import { useDeletePatient, usePatientConditions, usePatients } from "@/hooks/use-patients";
import { useUrlState } from "@/hooks/use-url-state";
import { getErrorMessage } from "@/lib/api";
import { countActivePatientFilters, parsePatientParams } from "@/lib/patient-params";
import type { Patient } from "@/types";

const FILTER_KEYS = ["search", "condition", "gender", "doctor", "from", "to"];

export function PatientsView() {
  const { searchParams, update, clear } = useUrlState();
  const params = useMemo(() => parsePatientParams(searchParams), [searchParams]);
  const activeCount = countActivePatientFilters(params);

  const { data, isLoading, isFetching, isPlaceholderData, isError, error, refetch } = usePatients(params);
  const { data: conditions } = usePatientConditions();
  const { data: doctors } = useDoctorOptions();
  const deletePatient = useDeletePatient();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Patient | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState<Patient | null>(null);

  const openEdit = useCallback((p: Patient) => {
    setEditing(p);
    setFormOpen(true);
  }, []);
  const openDelete = useCallback((p: Patient) => {
    setDeleting(p);
    setDeleteOpen(true);
  }, []);
  const clearFilters = useCallback(() => clear(FILTER_KEYS), [clear]);

  // Deleting the last row of the last page -> step back to a page that exists
  const totalPages = data?.meta.totalPages;
  useEffect(() => {
    if (!isPlaceholderData && totalPages && params.page > totalPages) {
      update({ page: totalPages === 1 ? null : totalPages }, { keepPage: true });
    }
  }, [isPlaceholderData, totalPages, params.page, update]);

  const confirmDelete = () => {
    if (!deleting) return;
    deletePatient.mutate(deleting._id, {
      onSuccess: () => {
        toast.success("Patient deleted");
        setDeleteOpen(false);
      },
      onError: (err) => toast.error(getErrorMessage(err)),
    });
  };

  const total = data?.meta.total;
  const empty =
    activeCount > 0 ? (
      <EmptyState
        icon={FilterX}
        title="No patients match your filters"
        description="Try a different search term or remove some filters."
        action={
          <Button type="button" variant="outline" onClick={clearFilters}>
            Clear filters
          </Button>
        }
      />
    ) : (
      <EmptyState
        icon={UserRound}
        title="No patients yet"
        description="Patients are added from a doctor's page. Pick a doctor to add the first one."
        action={
          <Link
            href="/doctors"
            className="inline-flex h-9 items-center rounded-lg border bg-background px-4 text-sm font-medium hover:bg-accent"
          >
            Go to doctors
          </Link>
        }
      />
    );

  return (
    <>
      <PageHeader
        title="Patients"
        description={
          total !== undefined
            ? `${total} patient${total === 1 ? "" : "s"} ${activeCount ? "match your filters" : "in total"}`
            : "Browse, edit and manage all patients."
        }
      />

      <PatientFilters
        params={params}
        conditions={conditions}
        doctors={doctors}
        activeCount={activeCount}
        onChange={update}
        onClear={clearFilters}
      />

      {isError && !data ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border bg-card px-6 py-16 text-center shadow-sm" role="alert">
          <AlertCircle className="size-8 text-destructive" aria-hidden />
          <div className="space-y-1">
            <h3 className="font-medium">Couldn&apos;t load patients</h3>
            <p className="text-sm text-muted-foreground">{getErrorMessage(error)}</p>
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => refetch()}>
              Try again
            </Button>
            {activeCount > 0 && (
              <Button type="button" variant="ghost" onClick={clearFilters}>
                Clear filters
              </Button>
            )}
          </div>
        </div>
      ) : (
        <PatientsTable
          showDoctor
          rows={data?.data ?? []}
          isLoading={isLoading}
          isFetching={isFetching}
          skeletonRows={params.limit > 10 ? 10 : params.limit}
          empty={empty}
          onEdit={openEdit}
          onDelete={openDelete}
          footer={
            data && data.meta.total > 0 ? (
              <Pagination
                page={Math.min(params.page, data.meta.totalPages)}
                totalPages={data.meta.totalPages}
                total={data.meta.total}
                limit={params.limit}
                disabled={isFetching}
                onPageChange={(page) => update({ page: page === 1 ? null : page }, { keepPage: true })}
                onLimitChange={(limit) => update({ limit: limit === 10 ? null : limit })}
              />
            ) : null
          }
        />
      )}

      <PatientFormDialog open={formOpen} patient={editing} allowDoctorChange onClose={() => setFormOpen(false)} />

      <ConfirmDialog
        open={deleteOpen}
        title="Delete patient?"
        description={deleting ? `${deleting.name} will be permanently deleted. This can't be undone.` : ""}
        confirmLabel="Delete"
        destructive
        loading={deletePatient.isPending}
        onConfirm={confirmDelete}
        onClose={() => setDeleteOpen(false)}
      />
    </>
  );
}
