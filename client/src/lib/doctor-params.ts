export const PAGE_SIZES = [10, 20, 50] as const;

export const SORT_OPTIONS = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "name_asc", label: "Name A-Z" },
  { value: "name_desc", label: "Name Z-A" },
] as const;

export type SortValue = (typeof SORT_OPTIONS)[number]["value"];

export interface DoctorParams {
  page: number;
  limit: number;
  sort: SortValue;
  search?: string;
  specialization?: string;
  hospital?: string;
  from?: string;
  to?: string;
}

interface ParamSource {
  get(name: string): string | null;
}

/** URL -> validated params. Anything malformed falls back to a safe default. */
export function parseDoctorParams(sp: ParamSource): DoctorParams {
  const text = (key: string) => sp.get(key)?.trim() || undefined;
  const page = Number.parseInt(sp.get("page") ?? "", 10);
  const limit = Number.parseInt(sp.get("limit") ?? "", 10);
  const sort = sp.get("sort");

  return {
    page: Number.isFinite(page) && page > 0 ? page : 1,
    limit: (PAGE_SIZES as readonly number[]).includes(limit) ? limit : PAGE_SIZES[0],
    sort: SORT_OPTIONS.some((o) => o.value === sort) ? (sort as SortValue) : "newest",
    search: text("search"),
    specialization: text("specialization"),
    hospital: text("hospital"),
    from: text("from"),
    to: text("to"),
  };
}

export function countActiveFilters(p: DoctorParams) {
  return [p.search, p.specialization, p.hospital, p.from, p.to].filter(Boolean).length;
}
