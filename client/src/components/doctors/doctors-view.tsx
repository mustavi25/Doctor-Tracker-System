"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertCircle, FilterX, Plus, Stethoscope } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { Pagination } from "@/components/shared/pagination";
import { PageHeader } from "@/components/layout/page-header";
import { DoctorFilters } from "./doctor-filters";
import { DoctorFormDialog } from "./doctor-form-dialog";
import { DoctorsTable } from "./doctors-table";
import { useDeleteDoctor, useDoctorFilterOptions, useDoctors } from "@/hooks/use-doctors";
import { useUrlState } from "@/hooks/use-url-state";
import { getErrorMessage } from "@/lib/api";
import { countActiveFilters, parseDoctorParams } from "@/lib/doctor-params";
import type { Doctor } from "@/types";

const FILTER_KEYS = ["search", "specialization", "hospital", "from", "to"];

export function DoctorsView() {
  const { searchParams, update, clear } = useUrlState();
  const params = useMemo(() => parseDoctorParams(searchParams), [searchParams]);
  const activeCount = countActiveFilters(params);

  const { data, isLoading, isFetching, isPlaceholderData, isError, error, refetch } = useDoctors(params);
  const { data: filterOptions } = useDoctorFilterOptions();
  const deleteDoctor = useDeleteDoctor();

  // Dialog state: `open` and the target are separate so content doesn't blank while closing
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Doctor | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState<Doctor | null>(null);

  const openCreate = useCallback(() => {
    setEditing(null);
    setFormOpen(true);
  }, []);
  const openEdit = useCallback((d: Doctor) => {
    setEditing(d);
    setFormOpen(true);
  }, []);
  const openDelete = useCallback((d: Doctor) => {
    setDeleting(d);
    setDeleteOpen(true);
  }, []);

  const clearFilters = useCallback(() => clear(FILTER_KEYS), [clear]);

  // After deleting the last row of the last page, step back to a page that exists
  const totalPages = data?.meta.totalPages;
  useEffect(() => {
    if (!isPlaceholderData && totalPages && params.page > totalPages) {
      update({ page: totalPages === 1 ? null : totalPages }, { keepPage: true });
    }
  }, [isPlaceholderData, totalPages, params.page, update]);

  const confirmDelete = () => {
    if (!deleting) return;
    deleteDoctor.mutate(deleting._id, {
      onSuccess: (res) => {
        toast.success(
          res.patientsDeleted > 0
            ? `Doctor deleted along with ${res.patientsDeleted} patient${res.patientsDeleted > 1 ? "s" : ""}`
            : "Doctor deleted"
        );
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
        title="No doctors match your filters"
        description="Try a different search term or remove some filters."
        action={
          <Button type="button" variant="outline" onClick={clearFilters}>
            Clear filters
          </Button>
        }
      />
    ) : (
      <EmptyState
        icon={Stethoscope}
        title="No doctors yet"
        description="Add your first doctor to start tracking patients."
        action={
          <Button type="button" onClick={openCreate}>
            <Plus className="size-4" aria-hidden /> Add doctor
          </Button>
        }
      />
    );

  return (
    <>
      <PageHeader
        title="Doctors"
        description={total !== undefined ? `${total} doctor${total === 1 ? "" : "s"} ${activeCount ? "match your filters" : "in total"}` : "Manage doctors and view their patients."}
        actions={
          <Button type="button" onClick={openCreate}>
            <Plus className="size-4" aria-hidden /> Add doctor
          </Button>
        }
      />

      <DoctorFilters
        params={params}
        options={filterOptions}
        activeCount={activeCount}
        onChange={update}
        onClear={clearFilters}
      />

      {isError && !data ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border bg-card px-6 py-16 text-center shadow-sm" role="alert">
          <AlertCircle className="size-8 text-destructive" aria-hidden />
          <div className="space-y-1">
            <h3 className="font-medium">Couldn&apos;t load doctors</h3>
            <p className="text-sm text-muted-foreground">{getErrorMessage(error)}</p>
          </div>
          <Button type="button" variant="outline" onClick={() => refetch()}>
            Try again
          </Button>
        </div>
      ) : (
        <DoctorsTable
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

      <DoctorFormDialog open={formOpen} doctor={editing} onClose={() => setFormOpen(false)} />

      <ConfirmDialog
        open={deleteOpen}
        title="Delete doctor?"
        description={
          deleting
            ? `${deleting.name} will be permanently removed${
                deleting.patientCount ? `, together with their ${deleting.patientCount} patient${deleting.patientCount > 1 ? "s" : ""}` : ""
              }. This can't be undone.`
            : ""
        }
        confirmLabel="Delete"
        destructive
        loading={deleteDoctor.isPending}
        onConfirm={confirmDelete}
        onClose={() => setDeleteOpen(false)}
      />
    </>
  );
}
