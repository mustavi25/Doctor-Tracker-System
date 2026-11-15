"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/shared/modal";
import { FormField } from "@/components/shared/form-field";
import { useCreateDoctor, useDoctorFilterOptions, useUpdateDoctor } from "@/hooks/use-doctors";
import { getErrorMessage, getFieldErrors } from "@/lib/api";
import type { Doctor } from "@/types";

const schema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100, "Name is too long"),
  specialization: z.string().trim().min(2, "Specialization is required").max(100, "Too long"),
  hospital: z.string().trim().min(2, "Hospital is required").max(150, "Too long"),
  phone: z.string().trim().regex(/^[+()\d\s-]{7,20}$/, "Enter a valid phone number"),
  email: z.string().trim().min(1, "Email is required").email("Enter a valid email address"),
});
type FormValues = z.infer<typeof schema>;
const FIELDS = ["name", "specialization", "hospital", "phone", "email"] as const;

interface DoctorFormDialogProps {
  open: boolean;
  /** Pass a doctor to edit; omit to create */
  doctor?: Doctor | null;
  onClose: () => void;
}

export function DoctorFormDialog({ open, doctor, onClose }: DoctorFormDialogProps) {
  const isEdit = !!doctor;
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Edit doctor" : "Add doctor"}
      description={isEdit ? "Update the doctor's details." : "Create a new doctor profile."}
    >
      <DoctorForm key={doctor?._id ?? "new"} doctor={doctor ?? null} onClose={onClose} />
    </Modal>
  );
}

function DoctorForm({ doctor, onClose }: { doctor: Doctor | null; onClose: () => void }) {
  const create = useCreateDoctor();
  const update = useUpdateDoctor();
  const { data: options } = useDoctorFilterOptions();
  const pending = create.isPending || update.isPending;

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: doctor?.name ?? "",
      specialization: doctor?.specialization ?? "",
      hospital: doctor?.hospital ?? "",
      phone: doctor?.phone ?? "",
      email: doctor?.email ?? "",
    },
  });

  const callbacks = {
    onSuccess: () => {
      toast.success(doctor ? "Doctor updated" : "Doctor added");
      onClose();
    },
    onError: (err: unknown) => {
      // Show API field errors (e.g. duplicate email) under the matching input
      const fieldErrors = getFieldErrors(err);
      let handled = false;
      for (const field of FIELDS) {
        if (fieldErrors[field]) {
          setError(field, { message: fieldErrors[field] });
          handled = true;
        }
      }
      if (!handled) toast.error(getErrorMessage(err));
    },
  };

  const onSubmit = (values: FormValues) => {
    if (doctor) update.mutate({ id: doctor._id, body: values }, callbacks);
    else create.mutate(values, callbacks);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <FormField id="doctor-name" label="Full name" error={errors.name?.message}>
            <Input id="doctor-name" placeholder="Dr. Ayesha Rahman" autoComplete="off" aria-invalid={!!errors.name} {...register("name")} />
          </FormField>
        </div>

        <FormField id="doctor-specialization" label="Specialization" error={errors.specialization?.message}>
          <Input
            id="doctor-specialization"
            list="specialization-options"
            placeholder="Cardiology"
            autoComplete="off"
            aria-invalid={!!errors.specialization}
            {...register("specialization")}
          />
          <datalist id="specialization-options">
            {options?.specializations.map((s) => <option key={s} value={s} />)}
          </datalist>
        </FormField>

        <FormField id="doctor-hospital" label="Hospital" error={errors.hospital?.message}>
          <Input
            id="doctor-hospital"
            list="hospital-options"
            placeholder="Square Hospital"
            autoComplete="off"
            aria-invalid={!!errors.hospital}
            {...register("hospital")}
          />
          <datalist id="hospital-options">
            {options?.hospitals.map((h) => <option key={h} value={h} />)}
          </datalist>
        </FormField>

        <FormField id="doctor-phone" label="Phone" error={errors.phone?.message}>
          <Input id="doctor-phone" type="tel" placeholder="+8801712345678" autoComplete="off" aria-invalid={!!errors.phone} {...register("phone")} />
        </FormField>

        <FormField id="doctor-email" label="Email" error={errors.email?.message}>
          <Input id="doctor-email" type="email" placeholder="doctor@hospital.com" autoComplete="off" aria-invalid={!!errors.email} {...register("email")} />
        </FormField>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onClose} disabled={pending}>
          Cancel
        </Button>
        <Button type="submit" disabled={pending}>
          {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
          {doctor ? "Save changes" : "Add doctor"}
        </Button>
      </div>
    </form>
  );
}
