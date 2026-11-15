"use client";

import { memo, useCallback, useMemo } from "react";
import Link from "next/link";
import { Building2, Mail, Pencil, Phone, Trash2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/shared/chip";
import { DataTable, type Column } from "@/components/shared/data-table";
import { InitialsAvatar } from "@/components/shared/initials-avatar";
import { formatDate } from "@/lib/format";
import type { Doctor } from "@/types";

interface DoctorsTableProps {
  rows: Doctor[];
  isLoading: boolean;
  isFetching: boolean;
  skeletonRows: number;
  empty: React.ReactNode;
  footer: React.ReactNode;
  onEdit: (doctor: Doctor) => void;
  onDelete: (doctor: Doctor) => void;
}

function RowActions({ doctor, onEdit, onDelete }: { doctor: Doctor; onEdit: (d: Doctor) => void; onDelete: (d: Doctor) => void }) {
  return (
    <div className="flex items-center justify-end gap-1">
      <Button type="button" variant="ghost" size="icon" aria-label={`Edit ${doctor.name}`} title="Edit" onClick={() => onEdit(doctor)}>
        <Pencil className="size-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label={`Delete ${doctor.name}`}
        title="Delete"
        className="text-destructive hover:text-destructive"
        onClick={() => onDelete(doctor)}
      >
        <Trash2 className="size-4" />
      </Button>
    </div>
  );
}

function PatientCount({ doctor }: { doctor: Doctor }) {
  return (
    <Link
      href={`/doctors/${doctor._id}`}
      className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
      title="View patients"
    >
      <Users className="size-4" aria-hidden />
      {doctor.patientCount ?? 0}
    </Link>
  );
}

export const DoctorsTable = memo(function DoctorsTable({
  rows,
  isLoading,
  isFetching,
  skeletonRows,
  empty,
  footer,
  onEdit,
  onDelete,
}: DoctorsTableProps) {
  const columns = useMemo<Column<Doctor>[]>(
    () => [
      {
        id: "doctor",
        header: "Doctor",
        cell: (d) => (
          <div className="flex items-center gap-3">
            <InitialsAvatar name={d.name} />
            <div className="min-w-0">
              <Link href={`/doctors/${d._id}`} className="font-medium hover:text-primary hover:underline">
                {d.name}
              </Link>
              <p className="truncate text-xs text-muted-foreground">{d.email}</p>
            </div>
          </div>
        ),
      },
      { id: "specialization", header: "Specialization", cell: (d) => <Chip tone="primary">{d.specialization}</Chip> },
      { id: "hospital", header: "Hospital", cell: (d) => d.hospital },
      { id: "phone", header: "Phone", cell: (d) => <span className="whitespace-nowrap text-muted-foreground">{d.phone}</span> },
      { id: "patients", header: "Patients", cell: (d) => <PatientCount doctor={d} /> },
      { id: "added", header: "Added", cell: (d) => <span className="whitespace-nowrap text-muted-foreground">{formatDate(d.createdAt)}</span> },
      {
        id: "actions",
        header: <span className="sr-only">Actions</span>,
        className: "w-px",
        cell: (d) => <RowActions doctor={d} onEdit={onEdit} onDelete={onDelete} />,
      },
    ],
    [onEdit, onDelete]
  );

  const renderMobileCard = useCallback(
    (d: Doctor) => (
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <InitialsAvatar name={d.name} />
            <div className="min-w-0">
              <Link href={`/doctors/${d._id}`} className="font-medium hover:text-primary hover:underline">
                {d.name}
              </Link>
              <div className="mt-1">
                <Chip tone="primary">{d.specialization}</Chip>
              </div>
            </div>
          </div>
          <RowActions doctor={d} onEdit={onEdit} onDelete={onDelete} />
        </div>
        <dl className="space-y-1.5 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Building2 className="size-4 shrink-0" aria-hidden /> <dt className="sr-only">Hospital</dt>
            <dd>{d.hospital}</dd>
          </div>
          <div className="flex items-center gap-2">
            <Phone className="size-4 shrink-0" aria-hidden /> <dt className="sr-only">Phone</dt>
            <dd>{d.phone}</dd>
          </div>
          <div className="flex items-center gap-2">
            <Mail className="size-4 shrink-0" aria-hidden /> <dt className="sr-only">Email</dt>
            <dd className="truncate">{d.email}</dd>
          </div>
        </dl>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <PatientCount doctor={d} />
          <span>Added {formatDate(d.createdAt)}</span>
        </div>
      </div>
    ),
    [onEdit, onDelete]
  );

  return (
    <DataTable
      columns={columns}
      rows={rows}
      getRowId={(d) => d._id}
      renderMobileCard={renderMobileCard}
      isLoading={isLoading}
      isFetching={isFetching}
      skeletonRows={skeletonRows}
      empty={empty}
      footer={footer}
    />
  );
});
