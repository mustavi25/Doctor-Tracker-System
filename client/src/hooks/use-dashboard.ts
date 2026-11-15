"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { DashboardStats } from "@/types";

export const RANGE_OPTIONS = [7, 30, 90] as const;
export type RangeDays = (typeof RANGE_OPTIONS)[number];

export function parseRange(value: string | null): RangeDays {
  const n = Number.parseInt(value ?? "", 10);
  return (RANGE_OPTIONS as readonly number[]).includes(n) ? (n as RangeDays) : 30;
}

export function useDashboardStats(days: number) {
  return useQuery({
    queryKey: ["dashboard", "stats", days],
    queryFn: async ({ signal }) => (await api.get<DashboardStats>("/dashboard/stats", { params: { days }, signal })).data,
    // Switching 7/30/90 days keeps the old charts visible until the new data lands
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  });
}
