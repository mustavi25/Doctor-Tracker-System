"use client";

import { memo, useCallback, useMemo } from "react";
import Link from "next/link";
import { Pencil, Phone, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/shared/chip";
import { DataTable, type Column } from "@/components/shared/data-table";
import { InitialsAvatar } from "@/components/shared/initials-avatar";
import { formatDate } from "@/lib/format";
import type { Patient } from "@/types";

interface PatientsTableProps {
  rows: Patient[];
  isLoading: boolean;
  isFetching: boolean;
  skeletonRows: number;
  empty: React.ReactNode;
  footer: React.ReactNode;
  /** Adds a "Doctor" column (used on the global Patients page) */
  showDoctor?: boolean;
  onEdit: (patient: Patient) => void;
  onDelete: (patient: Patient) => void;
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

function ageGender(p: Patient) {
  const parts = [p.age !== undefined ? `${p.age} yrs` : null, p.gender ? cap(p.gender) : null].filter(Boolean);
  return parts.length ? parts.join(" · ") : "-";
}

function DoctorLink({ patient }: { patient: Patient }) {
  if (typeof patient.doctor === "string") return null;
  return (
    <Link href={`/doctors/${patient.doctor._id}`} className="hover:text-primary hover:underline">
      {patient.doctor.name}
    </Link>
  );
}

function RowActions({ patient, onEdit, onDelete }: { patient: Patient; onEdit: (p: Patient) => void; onDelete: (p: Patient) => void }) {
  return (
    <div className="flex items-center justify-end gap-1">
      <Button type="button" variant="ghost" size="icon" aria-label={`Edit ${patient.name}`} title="Edit" onClick={() => onEdit(patient)}>
        <Pencil className="size-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label={`Delete ${patient.name}`}
        title="Delete"
        className="text-destructive hover:text-destructive"
        onClick={() => onDelete(patient)}
      >
        <Trash2 className="size-4" />
      </Button>
    </div>
  );
}

export const PatientsTable = memo(function PatientsTable({
  rows,
  isLoading,
  isFetching,
  skeletonRows,
  empty,
  footer,
  showDoctor = false,
  onEdit,
  onDelete,
}: PatientsTableProps) {
  const columns = useMemo<Column<Patient>[]>(() => {
    const cols: Column<Patient>[] = [
      {
        id: "patient",
        header: "Patient",
        cell: (p) => (
          <div className="flex items-center gap-3">
            <InitialsAvatar name={p.name} />
            <div className="min-w-0">
              <p className="font-medium">{p.name}</p>
              <p className="truncate text-xs text-muted-foreground">{p.phone ?? "No phone"}</p>
            </div>
          </div>
        ),
      },
      { id: "age", header: "Age / Gender", cell: (p) => <span className="whitespace-nowrap text-muted-foreground">{ageGender(p)}</span> },
      { id: "condition", header: "Condition", cell: (p) => <Chip tone="primary">{p.condition}</Chip> },
    ];
    if (showDoctor) cols.push({ id: "doctor", header: "Doctor", cell: (p) => <DoctorLink patient={p} /> });
    cols.push(
      { id: "added", header: "Added", cell: (p) => <span className="whitespace-nowrap text-muted-foreground">{formatDate(p.createdAt)}</span> },
      {
        id: "actions",
        header: <span className="sr-only">Actions</span>,
        className: "w-px",
        cell: (p) => <RowActions patient={p} onEdit={onEdit} onDelete={onDelete} />,
      }
    );
    return cols;
  }, [showDoctor, onEdit, onDelete]);

  const renderMobileCard = useCallback(
    (p: Patient) => (
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <InitialsAvatar name={p.name} />
            <div className="min-w-0">
              <p className="font-medium">{p.name}</p>
              <div className="mt-1">
                <Chip tone="primary">{p.condition}</Chip>
              </div>
            </div>
          </div>
          <RowActions patient={p} onEdit={onEdit} onDelete={onDelete} />
        </div>
        <div className="space-y-1.5 text-sm text-muted-foreground">
          <p>{ageGender(p)}</p>
          {p.phone && (
            <p className="flex items-center gap-2">
              <Phone className="size-4 shrink-0" aria-hidden /> {p.phone}
            </p>
          )}
          {showDoctor && typeof p.doctor !== "string" && <p>Doctor: <DoctorLink patient={p} /></p>}
        </div>
        <p className="text-xs text-muted-foreground">Added {formatDate(p.createdAt)}</p>
      </div>
    ),
    [showDoctor, onEdit, onDelete]
  );

  return (
    <DataTable
      columns={columns}
      rows={rows}
      getRowId={(p) => p._id}
      renderMobileCard={renderMobileCard}
      isLoading={isLoading}
      isFetching={isFetching}
      skeletonRows={skeletonRows}
      empty={empty}
      footer={footer}
    />
  );
});
