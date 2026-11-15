"use client";

import { useState } from "react";
import { FilterX, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SearchInput } from "@/components/shared/search-input";
import { SelectField } from "@/components/shared/select-field";
import { cn } from "@/lib/utils";
import { SORT_OPTIONS } from "@/lib/doctor-params";
import type { PatientParams } from "@/lib/patient-params";
import type { UrlPatch } from "@/hooks/use-url-state";
import type { DoctorOption } from "@/hooks/use-doctors";

interface PatientFiltersProps {
  params: PatientParams;
  conditions?: string[];
  doctors?: DoctorOption[];
  activeCount: number;
  onChange: (patch: UrlPatch) => void;
  onClear: () => void;
}

const GENDER_OPTIONS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
];

export function PatientFilters({ params, conditions = [], doctors = [], activeCount, onChange, onClear }: PatientFiltersProps) {
  const [showMobile, setShowMobile] = useState(false);

  return (
    <section aria-label="Search and filters" className="mb-4 space-y-4 rounded-xl border bg-card p-4 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <SearchInput
          className="flex-1"
          label="Search patients"
          placeholder="Search by name, condition or phone..."
          value={params.search ?? ""}
          onSearch={(search) => onChange({ search })}
        />
        <div className="flex items-end gap-2">
          <SelectField
            id="patient-sort"
            aria-label="Sort patients"
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
            aria-controls="patient-filter-grid"
            onClick={() => setShowMobile((v) => !v)}
          >
            <SlidersHorizontal className="size-4" aria-hidden /> Filters
            {activeCount > 0 && (
              <span className="ml-1 rounded-full bg-primary px-1.5 text-xs text-primary-foreground">{activeCount}</span>
            )}
          </Button>
        </div>
      </div>

      <div id="patient-filter-grid" className={cn("gap-3 sm:grid sm:grid-cols-2 lg:grid-cols-5", showMobile ? "grid" : "hidden")}>
        <SelectField
          id="filter-condition"
          label="Condition"
          placeholder="All conditions"
          value={params.condition ?? ""}
          onChange={(e) => onChange({ condition: e.target.value })}
          options={conditions.map((c) => ({ value: c, label: c }))}
        />
        <SelectField
          id="filter-doctor"
          label="Doctor"
          placeholder="All doctors"
          value={params.doctor ?? ""}
          onChange={(e) => onChange({ doctor: e.target.value })}
          options={doctors.map((d) => ({ value: d._id, label: d.name }))}
        />
        <SelectField
          id="filter-gender"
          label="Gender"
          placeholder="Any gender"
          value={params.gender ?? ""}
          onChange={(e) => onChange({ gender: e.target.value })}
          options={GENDER_OPTIONS}
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
