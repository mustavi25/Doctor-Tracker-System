"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertCircle, FilterX, Plus, UserRound } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { Pagination } from "@/components/shared/pagination";
import { SearchInput } from "@/components/shared/search-input";
import { SelectField } from "@/components/shared/select-field";
import { PatientFormDialog } from "@/components/patients/patient-form-dialog";
import { PatientsTable } from "@/components/patients/patients-table";
import { useDoctorPatients, usePatientConditions, useRemoveDoctorPatient } from "@/hooks/use-patients";
import { useUrlState } from "@/hooks/use-url-state";
import { getErrorMessage } from "@/lib/api";
import { SORT_OPTIONS } from "@/lib/doctor-params";
import { countActivePatientFilters, parsePatientParams } from "@/lib/patient-params";
import type { Patient } from "@/types";

// Only these URL keys belong to this section's filters
const FILTER_KEYS = ["search", "condition"];

export function DoctorPatientsSection({ doctorId, doctorName }: { doctorId: string; doctorName: string }) {
  const { searchParams, update, clear } = useUrlState();
  const params = useMemo(() => parsePatientParams(searchParams), [searchParams]);
  // This section only exposes search + condition filters
  const activeCount = countActivePatientFilters({ ...params, gender: undefined, doctor: undefined, from: undefined, to: undefined });

  const { data, isLoading, isFetching, isPlaceholderData, isError, error, refetch } = useDoctorPatients(doctorId, params);
  const { data: conditions } = usePatientConditions();
  const removePatient = useRemoveDoctorPatient(doctorId);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Patient | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState<Patient | null>(null);

  const openCreate = useCallback(() => {
    setEditing(null);
    setFormOpen(true);
  }, []);
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
    removePatient.mutate(deleting._id, {
      onSuccess: () => {
        toast.success("Patient removed");
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
        description="Try a different search term or condition."
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
        description={`${doctorName} doesn't have any patients. Add the first one.`}
        action={
          <Button type="button" onClick={openCreate}>
            <Plus className="size-4" aria-hidden /> Add patient
          </Button>
        }
      />
    );

  return (
    <section aria-labelledby="patients-heading" className="mt-8">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 id="patients-heading" className="text-lg font-semibold tracking-tight">
            Patients{total !== undefined && <span className="ml-2 text-sm font-normal text-muted-foreground">({total})</span>}
          </h2>
        </div>
        <Button type="button" onClick={openCreate}>
          <Plus className="size-4" aria-hidden /> Add patient
        </Button>
      </div>

      <div className="mb-4 grid gap-3 rounded-xl border bg-card p-4 shadow-sm sm:grid-cols-[1fr_12rem_11rem] sm:items-end">
        <SearchInput
          label="Search patients"
          placeholder="Search by name, condition or phone..."
          value={params.search ?? ""}
          onSearch={(search) => update({ search })}
        />
        <SelectField
          id="patient-condition-filter"
          aria-label="Filter by condition"
          placeholder="All conditions"
          value={params.condition ?? ""}
          onChange={(e) => update({ condition: e.target.value })}
          options={(conditions ?? []).map((c) => ({ value: c, label: c }))}
        />
        <SelectField
          id="patient-sort"
          aria-label="Sort patients"
          value={params.sort}
          onChange={(e) => update({ sort: e.target.value === "newest" ? null : e.target.value })}
          options={SORT_OPTIONS}
        />
        {activeCount > 0 && (
          <div className="flex items-center justify-between border-t pt-3 sm:col-span-full">
            <p className="text-sm text-muted-foreground">
              {activeCount} filter{activeCount > 1 ? "s" : ""} applied
            </p>
            <Button type="button" variant="ghost" size="sm" onClick={clearFilters}>
              <FilterX className="size-4" aria-hidden /> Clear filters
            </Button>
          </div>
        )}
      </div>

      {isError && !data ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border bg-card px-6 py-16 text-center shadow-sm" role="alert">
          <AlertCircle className="size-8 text-destructive" aria-hidden />
          <div className="space-y-1">
            <h3 className="font-medium">Couldn&apos;t load patients</h3>
            <p className="text-sm text-muted-foreground">{getErrorMessage(error)}</p>
          </div>
          <Button type="button" variant="outline" onClick={() => refetch()}>
            Try again
          </Button>
        </div>
      ) : (
        <PatientsTable
          rows={data?.data ?? []}
          isLoading={isLoading}
          isFetching={isFetching}
          skeletonRows={Math.min(params.limit, 6)}
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

      <PatientFormDialog open={formOpen} patient={editing} doctorId={doctorId} onClose={() => setFormOpen(false)} />

      <ConfirmDialog
        open={deleteOpen}
        title="Remove patient?"
        description={deleting ? `${deleting.name} will be permanently deleted from ${doctorName}'s patients. This can't be undone.` : ""}
        confirmLabel="Delete"
        destructive
        loading={removePatient.isPending}
        onConfirm={confirmDelete}
        onClose={() => setDeleteOpen(false)}
      />
    </section>
  );
}
