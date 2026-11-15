"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { doctorKeys } from "./use-doctors";
import type { PatientParams } from "@/lib/patient-params";
import type { Gender, Paginated, Patient } from "@/types";

export const patientKeys = {
  all: ["patients"] as const,
  list: (params: PatientParams) => ["patients", "list", params] as const,
  ofDoctor: (doctorId: string, params: PatientParams) => ["patients", "doctor", doctorId, params] as const,
  conditions: ["patients", "conditions"] as const,
};

export interface PatientCreateBody {
  name: string;
  condition: string;
  age?: number;
  gender?: Gender;
  phone?: string;
}

/** null clears an optional field on the server */
export interface PatientUpdateBody {
  name?: string;
  condition?: string;
  age?: number | null;
  gender?: Gender | null;
  phone?: string | null;
  doctor?: string;
}

export function usePatients(params: PatientParams) {
  return useQuery({
    queryKey: patientKeys.list(params),
    queryFn: async ({ signal }) => (await api.get<Paginated<Patient>>("/patients", { params, signal })).data,
    placeholderData: keepPreviousData,
  });
}

export function useDoctorPatients(doctorId: string, params: PatientParams) {
  return useQuery({
    queryKey: patientKeys.ofDoctor(doctorId, params),
    queryFn: async ({ signal }) =>
      (await api.get<Paginated<Patient>>(`/doctors/${doctorId}/patients`, { params, signal })).data,
    placeholderData: keepPreviousData,
  });
}

export function usePatientConditions() {
  return useQuery({
    queryKey: patientKeys.conditions,
    queryFn: async () => (await api.get<{ conditions: string[] }>("/patients/conditions")).data.conditions,
    staleTime: 5 * 60_000,
  });
}

/** Patients changed -> patient lists, doctor patient counts and the dashboard are stale */
function useInvalidateAfterPatientChange() {
  const qc = useQueryClient();
  return () =>
    Promise.all([
      qc.invalidateQueries({ queryKey: patientKeys.all }),
      qc.invalidateQueries({ queryKey: doctorKeys.all }),
      qc.invalidateQueries({ queryKey: ["dashboard"] }),
    ]);
}

export function useAddPatient(doctorId: string | undefined) {
  const invalidate = useInvalidateAfterPatientChange();
  return useMutation({
    mutationFn: async (body: PatientCreateBody) => {
      if (!doctorId) throw new Error("A doctor is required to add a patient");
      return (await api.post<{ data: Patient }>(`/doctors/${doctorId}/patients`, body)).data.data;
    },
    onSuccess: invalidate,
  });
}

export function useUpdatePatient() {
  const invalidate = useInvalidateAfterPatientChange();
  return useMutation({
    mutationFn: async ({ id, body }: { id: string; body: PatientUpdateBody }) =>
      (await api.put<{ data: Patient }>(`/patients/${id}`, body)).data.data,
    onSuccess: invalidate,
  });
}

export function useDeletePatient() {
  const invalidate = useInvalidateAfterPatientChange();
  return useMutation({
    mutationFn: async (id: string) => (await api.delete<{ message: string }>(`/patients/${id}`)).data,
    onSuccess: invalidate,
  });
}

/** Removes a patient from a specific doctor's list */
export function useRemoveDoctorPatient(doctorId: string) {
  const invalidate = useInvalidateAfterPatientChange();
  return useMutation({
    mutationFn: async (patientId: string) =>
      (await api.delete<{ message: string }>(`/doctors/${doctorId}/patients/${patientId}`)).data,
    onSuccess: invalidate,
  });
}
