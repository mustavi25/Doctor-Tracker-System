import { PAGE_SIZES, SORT_OPTIONS, type SortValue } from "./doctor-params";
import type { Gender } from "@/types";

export interface PatientParams {
  page: number;
  limit: number;
  sort: SortValue;
  search?: string;
  condition?: string;
  gender?: Gender;
  doctor?: string;
  from?: string;
  to?: string;
}

interface ParamSource {
  get(name: string): string | null;
}

export function parsePatientParams(sp: ParamSource): PatientParams {
  const text = (key: string) => sp.get(key)?.trim() || undefined;
  const page = Number.parseInt(sp.get("page") ?? "", 10);
  const limit = Number.parseInt(sp.get("limit") ?? "", 10);
  const sort = sp.get("sort");
  const gender = sp.get("gender");

  return {
    page: Number.isFinite(page) && page > 0 ? page : 1,
    limit: (PAGE_SIZES as readonly number[]).includes(limit) ? limit : PAGE_SIZES[0],
    sort: SORT_OPTIONS.some((o) => o.value === sort) ? (sort as SortValue) : "newest",
    search: text("search"),
    condition: text("condition"),
    gender: gender === "male" || gender === "female" || gender === "other" ? gender : undefined,
    doctor: text("doctor"),
    from: text("from"),
    to: text("to"),
  };
}

export function countActivePatientFilters(p: PatientParams) {
  return [p.search, p.condition, p.gender, p.doctor, p.from, p.to].filter(Boolean).length;
}
