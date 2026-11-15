import { Building2, CalendarDays, Mail, Pencil, Phone, Trash2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/shared/chip";
import { InitialsAvatar } from "@/components/shared/initials-avatar";
import { formatDate } from "@/lib/format";
import type { Doctor } from "@/types";

interface DoctorProfileCardProps {
  doctor: Doctor;
  onEdit: () => void;
  onDelete: () => void;
}

function Detail({ icon: Icon, label, children }: { icon: typeof Phone; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        <Icon className="size-4" aria-hidden />
      </div>
      <div className="min-w-0">
        <dt className="text-xs text-muted-foreground">{label}</dt>
        <dd className="truncate text-sm font-medium">{children}</dd>
      </div>
    </div>
  );
}

export function DoctorProfileCard({ doctor, onEdit, onDelete }: DoctorProfileCardProps) {
  return (
    <section aria-label="Doctor profile" className="rounded-xl border bg-card p-5 shadow-sm sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-4">
          <InitialsAvatar name={doctor.name} className="size-14 text-lg" />
          <div className="min-w-0 space-y-1.5">
            <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">{doctor.name}</h1>
            <Chip tone="primary">{doctor.specialization}</Chip>
          </div>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={onEdit}>
            <Pencil className="size-4" aria-hidden /> Edit
          </Button>
          <Button type="button" variant="outline" className="text-destructive hover:text-destructive" onClick={onDelete}>
            <Trash2 className="size-4" aria-hidden /> Delete
          </Button>
        </div>
      </div>

      <dl className="mt-6 grid gap-5 border-t pt-5 sm:grid-cols-2 lg:grid-cols-5">
        <Detail icon={Building2} label="Hospital">{doctor.hospital}</Detail>
        <Detail icon={Phone} label="Phone">{doctor.phone}</Detail>
        <Detail icon={Mail} label="Email">{doctor.email}</Detail>
        <Detail icon={Users} label="Patients">{doctor.patientCount ?? 0}</Detail>
        <Detail icon={CalendarDays} label="Added">{formatDate(doctor.createdAt)}</Detail>
      </dl>
    </section>
  );
}
