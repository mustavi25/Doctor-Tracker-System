"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { DoctorParams } from "@/lib/doctor-params";
import type { Doctor, Paginated } from "@/types";

export const doctorKeys = {
  all: ["doctors"] as const,
  list: (params: DoctorParams) => ["doctors", "list", params] as const,
  filters: ["doctors", "filters"] as const,
  options: ["doctors", "options"] as const,
  detail: (id: string) => ["doctors", "detail", id] as const,
};

export interface DoctorFormBody {
  name: string;
  specialization: string;
  hospital: string;
  phone: string;
  email: string;
}

export interface DoctorFilterOptions {
  specializations: string[];
  hospitals: string[];
}

export function useDoctors(params: DoctorParams) {
  return useQuery({
    queryKey: doctorKeys.list(params),
    queryFn: async ({ signal }) => (await api.get<Paginated<Doctor>>("/doctors", { params, signal })).data,
    // Keep showing the previous page while the next one loads (no flicker/skeleton on paging)
    placeholderData: keepPreviousData,
  });
}

export function useDoctor(id: string) {
  return useQuery({
    queryKey: doctorKeys.detail(id),
    queryFn: async ({ signal }) => (await api.get<{ data: Doctor }>(`/doctors/${id}`, { signal })).data.data,
  });
}

export interface DoctorOption {
  _id: string;
  name: string;
  specialization: string;
}

/** id + name of every doctor, for "Doctor" dropdowns */
export function useDoctorOptions() {
  return useQuery({
    queryKey: doctorKeys.options,
    queryFn: async () => (await api.get<{ data: DoctorOption[] }>("/doctors/options")).data.data,
    staleTime: 5 * 60_000,
  });
}

export function useDoctorFilterOptions() {
  return useQuery({
    queryKey: doctorKeys.filters,
    queryFn: async () => (await api.get<DoctorFilterOptions>("/doctors/filters")).data,
    staleTime: 5 * 60_000,
  });
}

/** Doctors changed -> doctor lists, patient lists/counts and dashboard numbers are all stale */
function useInvalidateAfterDoctorChange() {
  const qc = useQueryClient();
  return () =>
    Promise.all([
      qc.invalidateQueries({ queryKey: doctorKeys.all }),
      qc.invalidateQueries({ queryKey: ["patients"] }),
      qc.invalidateQueries({ queryKey: ["dashboard"] }),
    ]);
}

export function useCreateDoctor() {
  const invalidate = useInvalidateAfterDoctorChange();
  return useMutation({
    mutationFn: async (body: DoctorFormBody) => (await api.post<{ data: Doctor }>("/doctors", body)).data.data,
    onSuccess: invalidate,
  });
}

export function useUpdateDoctor() {
  const invalidate = useInvalidateAfterDoctorChange();
  return useMutation({
    mutationFn: async ({ id, body }: { id: string; body: DoctorFormBody }) =>
      (await api.put<{ data: Doctor }>(`/doctors/${id}`, body)).data.data,
    onSuccess: invalidate,
  });
}

export function useDeleteDoctor() {
  const invalidate = useInvalidateAfterDoctorChange();
  return useMutation({
    mutationFn: async (id: string) =>
      (await api.delete<{ message: string; patientsDeleted: number }>(`/doctors/${id}`)).data,
    onSuccess: invalidate,
  });
}
