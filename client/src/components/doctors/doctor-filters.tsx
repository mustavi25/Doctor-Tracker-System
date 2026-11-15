"use client";

import { useState } from "react";
import { FilterX, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SearchInput } from "@/components/shared/search-input";
import { SelectField } from "@/components/shared/select-field";
import { cn } from "@/lib/utils";
import { SORT_OPTIONS, type DoctorParams } from "@/lib/doctor-params";
import type { UrlPatch } from "@/hooks/use-url-state";
import type { DoctorFilterOptions } from "@/hooks/use-doctors";

interface DoctorFiltersProps {
  params: DoctorParams;
  options?: DoctorFilterOptions;
  activeCount: number;
  onChange: (patch: UrlPatch) => void;
  onClear: () => void;
}

const toOptions = (values: string[] = []) => values.map((v) => ({ value: v, label: v }));

export function DoctorFilters({ params, options, activeCount, onChange, onClear }: DoctorFiltersProps) {
  // Filters are always visible on larger screens; on phones they fold away behind a button
  const [showMobile, setShowMobile] = useState(false);

  return (
    <section aria-label="Search and filters" className="mb-4 space-y-4 rounded-xl border bg-card p-4 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <SearchInput
          className="flex-1"
          label="Search doctors"
          placeholder="Search by name, email, hospital or specialization..."
          value={params.search ?? ""}
          onSearch={(search) => onChange({ search })}
        />
        <div className="flex items-end gap-2">
          <SelectField
            id="doctor-sort"
            aria-label="Sort doctors"
            className="min-w-40 sm:w-44"
            value={params.sort}
            onChange={(e) => onChange({ sort: e.target.value === "newest" ? null : e.target.value })}
            options={SORT_OPTIONS}
          />
          <Button
            type="button"
            variant="outline"
            className="sm:hidden"
            aria-expanded={showMobile}
            aria-controls="doctor-filter-grid"
            onClick={() => setShowMobile((v) => !v)}
          >
            <SlidersHorizontal className="size-4" aria-hidden /> Filters
            {activeCount > 0 && (
              <span className="ml-1 rounded-full bg-primary px-1.5 text-xs text-primary-foreground">{activeCount}</span>
            )}
          </Button>
        </div>
      </div>

      <div id="doctor-filter-grid" className={cn("gap-3 sm:grid sm:grid-cols-2 lg:grid-cols-4", showMobile ? "grid" : "hidden")}>
        <SelectField
          id="filter-specialization"
          label="Specialization"
          placeholder="All specializations"
          value={params.specialization ?? ""}
          onChange={(e) => onChange({ specialization: e.target.value })}
          options={toOptions(options?.specializations)}
        />
        <SelectField
          id="filter-hospital"
          label="Hospital"
          placeholder="All hospitals"
          value={params.hospital ?? ""}
          onChange={(e) => onChange({ hospital: e.target.value })}
          options={toOptions(options?.hospitals)}
        />
        <div className="space-y-1.5">
          <Label htmlFor="filter-from" className="text-xs font-medium text-muted-foreground">
            Added from
          </Label>
          <Input id="filter-from" type="date" value={params.from ?? ""} max={params.to} onChange={(e) => onChange({ from: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="filter-to" className="text-xs font-medium text-muted-foreground">
            Added to
          </Label>
          <Input id="filter-to" type="date" value={params.to ?? ""} min={params.from} onChange={(e) => onChange({ to: e.target.value })} />
        </div>
      </div>

      {activeCount > 0 && (
        <div className="flex items-center justify-between border-t pt-3">
          <p className="text-sm text-muted-foreground">
            {activeCount} filter{activeCount > 1 ? "s" : ""} applied
          </p>
          <Button type="button" variant="ghost" size="sm" onClick={onClear}>
            <FilterX className="size-4" aria-hidden /> Clear filters
          </Button>
        </div>
      )}
    </section>
  );
}
