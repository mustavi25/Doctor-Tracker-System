"use client";

import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/shared/form-field";
import { Modal } from "@/components/shared/modal";
import { SelectField } from "@/components/shared/select-field";
import { useDoctorOptions } from "@/hooks/use-doctors";
import { useAddPatient, usePatientConditions, useUpdatePatient, type PatientUpdateBody } from "@/hooks/use-patients";
import { getErrorMessage, getFieldErrors } from "@/lib/api";
import type { Gender, Patient } from "@/types";

// Everything is a string in the form; converted to numbers / null on submit
const schema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100, "Name is too long"),
  condition: z.string().trim().min(2, "Condition is required").max(150, "Too long"),
  age: z
    .string()
    .trim()
    .refine((v) => v === "" || (/^\d{1,3}$/.test(v) && Number(v) <= 130), "Enter an age between 0 and 130"),
  gender: z.enum(["", "male", "female", "other"]),
  phone: z
    .string()
    .trim()
    .refine((v) => v === "" || /^[+()\d\s-]{7,20}$/.test(v), "Enter a valid phone number"),
  doctor: z.string(),
});
type FormValues = z.infer<typeof schema>;
const FIELDS = ["name", "condition", "age", "gender", "phone", "doctor"] as const;

const GENDERS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
];

interface PatientFormDialogProps {
  open: boolean;
  /** Pass a patient to edit; omit to create (then doctorId is required) */
  patient?: Patient | null;
  doctorId?: string;
  /** Edit mode only: show a "Doctor" select so the patient can be reassigned */
  allowDoctorChange?: boolean;
  onClose: () => void;
}

export function PatientFormDialog({ open, patient, doctorId, allowDoctorChange, onClose }: PatientFormDialogProps) {
  const isEdit = !!patient;
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Edit patient" : "Add patient"}
      description={isEdit ? "Update the patient's details." : "Add a new patient under this doctor."}
    >
      <PatientForm
        key={patient?._id ?? "new"}
        patient={patient ?? null}
        doctorId={doctorId}
        allowDoctorChange={!!allowDoctorChange && !!patient}
        onClose={onClose}
      />
    </Modal>
  );
}

function PatientForm({
  patient,
  doctorId,
  allowDoctorChange,
  onClose,
}: {
  patient: Patient | null;
  doctorId?: string;
  allowDoctorChange: boolean;
  onClose: () => void;
}) {
  const currentDoctorId = patient ? (typeof patient.doctor === "string" ? patient.doctor : patient.doctor._id) : "";
  const add = useAddPatient(doctorId);
  const update = useUpdatePatient();
  const { data: conditions } = usePatientConditions();
  const { data: doctors } = useDoctorOptions();
  const pending = add.isPending || update.isPending;

  // The current doctor is always an option from the first render: a native <select> whose
  // options arrive after its value was set would otherwise silently show the first option.
  const doctorChoices = useMemo(() => {
    const list = (doctors ?? []).map((d) => ({ value: d._id, label: `${d.name} · ${d.specialization}` }));
    if (patient && typeof patient.doctor !== "string" && !list.some((o) => o.value === currentDoctorId)) {
      list.unshift({ value: currentDoctorId, label: `${patient.doctor.name} · ${patient.doctor.specialization}` });
    }
    return list;
  }, [doctors, patient, currentDoctorId]);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: patient?.name ?? "",
      condition: patient?.condition ?? "",
      age: patient?.age !== undefined ? String(patient.age) : "",
      gender: patient?.gender ?? "",
      phone: patient?.phone ?? "",
      doctor: currentDoctorId,
    },
  });

  const callbacks = {
    onSuccess: () => {
      toast.success(patient ? "Patient updated" : "Patient added");
      onClose();
    },
    onError: (err: unknown) => {
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

  const onSubmit = (v: FormValues) => {
    const age = v.age === "" ? null : Number(v.age);
    const gender = v.gender === "" ? null : (v.gender as Gender);
    const phone = v.phone === "" ? null : v.phone;

    if (patient) {
      // On edit, null explicitly clears the field
      const body: PatientUpdateBody = { name: v.name, condition: v.condition, age, gender, phone };
      if (allowDoctorChange && v.doctor && v.doctor !== currentDoctorId) body.doctor = v.doctor;
      update.mutate({ id: patient._id, body }, callbacks);
    } else {
      // On create, simply leave empty fields out
      add.mutate(
        {
          name: v.name,
          condition: v.condition,
          ...(age !== null && { age }),
          ...(gender !== null && { gender }),
          ...(phone !== null && { phone }),
        },
        callbacks
      );
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <FormField id="patient-name" label="Full name" error={errors.name?.message}>
            <Input id="patient-name" placeholder="Rahim Khan" autoComplete="off" aria-invalid={!!errors.name} {...register("name")} />
          </FormField>
        </div>

        <div className="sm:col-span-2">
          <FormField id="patient-condition" label="Condition" error={errors.condition?.message}>
            <Input
              id="patient-condition"
              list="condition-options"
              placeholder="Hypertension"
              autoComplete="off"
              aria-invalid={!!errors.condition}
              {...register("condition")}
            />
            <datalist id="condition-options">
              {conditions?.map((c) => <option key={c} value={c} />)}
            </datalist>
          </FormField>
        </div>

        <FormField id="patient-age" label="Age (optional)" error={errors.age?.message}>
          <Input id="patient-age" inputMode="numeric" placeholder="34" autoComplete="off" aria-invalid={!!errors.age} {...register("age")} />
        </FormField>

        <FormField id="patient-gender" label="Gender (optional)" error={errors.gender?.message}>
          <SelectField id="patient-gender" placeholder="Not specified" options={GENDERS} {...register("gender")} />
        </FormField>

        {allowDoctorChange && (
          <div className="sm:col-span-2">
            <FormField id="patient-doctor" label="Doctor" error={errors.doctor?.message}>
              <SelectField
                id="patient-doctor"
                options={doctorChoices}
                {...register("doctor")}
              />
            </FormField>
          </div>
        )}

        <div className="sm:col-span-2">
          <FormField id="patient-phone" label="Phone (optional)" error={errors.phone?.message}>
            <Input id="patient-phone" type="tel" placeholder="+8801712345678" autoComplete="off" aria-invalid={!!errors.phone} {...register("phone")} />
          </FormField>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onClose} disabled={pending}>
          Cancel
        </Button>
        <Button type="submit" disabled={pending}>
          {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
          {patient ? "Save changes" : "Add patient"}
        </Button>
      </div>
    </form>
  );
}
