"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import type { User } from "@/types";

export const meKey = ["auth", "me"] as const;

export function useMe() {
  return useQuery({
    queryKey: meKey,
    queryFn: async () => (await api.get<{ user: User }>("/auth/me")).data.user,
    staleTime: 5 * 60_000,
    retry: false,
  });
}

export function useLogin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: { email: string; password: string }) =>
      (await api.post<{ user: User }>("/auth/login", body)).data.user,
    onSuccess: (user) => qc.setQueryData(meKey, user),
  });
}

export function useLogout() {
  const qc = useQueryClient();
  const router = useRouter();
  return useMutation({
    mutationFn: () => api.post("/auth/logout"),
    onSettled: () => {
      qc.clear(); // drop every cached query so the next user never sees stale data
      router.replace("/login");
    },
  });
}
