"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SelectField } from "./select-field";
import { PAGE_SIZES } from "@/lib/doctor-params";

interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  limit: number;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  disabled?: boolean;
}

/** [1, "…", 4, 5, 6, "…", 12] style list; short lists show every page */
function getPageItems(page: number, total: number): (number | "ellipsis-l" | "ellipsis-r")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const items: (number | "ellipsis-l" | "ellipsis-r")[] = [1];
  const start = Math.max(2, page - 1);
  const end = Math.min(total - 1, page + 1);
  if (start > 2) items.push("ellipsis-l");
  for (let p = start; p <= end; p++) items.push(p);
  if (end < total - 1) items.push("ellipsis-r");
  items.push(total);
  return items;
}

export function Pagination({ page, totalPages, total, limit, onPageChange, onLimitChange, disabled }: PaginationProps) {
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  return (
    <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-4">
        <p className="text-sm text-muted-foreground" aria-live="polite">
          Showing <span className="font-medium text-foreground">{from}-{to}</span> of{" "}
          <span className="font-medium text-foreground">{total}</span>
        </p>
        <div className="hidden items-center gap-2 sm:flex">
          <span className="text-sm text-muted-foreground">Rows</span>
          <SelectField
            compact
            aria-label="Rows per page"
            value={String(limit)}
            onChange={(e) => onLimitChange(Number(e.target.value))}
            options={PAGE_SIZES.map((n) => ({ value: String(n), label: String(n) }))}
            className="w-20"
          />
        </div>
      </div>

      <nav className="flex items-center justify-between gap-1 sm:justify-end" aria-label="Pagination">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled || page <= 1}
          onClick={() => onPageChange(page - 1)}
          aria-label="Previous page"
        >
          <ChevronLeft className="size-4" /> <span className="hidden sm:inline">Previous</span>
        </Button>

        {/* Mobile: compact label. Desktop: numbered buttons */}
        <span className="px-3 text-sm text-muted-foreground sm:hidden">
          Page {page} of {totalPages}
        </span>
        <div className="hidden items-center gap-1 sm:flex">
          {getPageItems(page, totalPages).map((item) =>
            typeof item === "string" ? (
              <span key={item} className="px-1 text-muted-foreground" aria-hidden>
                …
              </span>
            ) : (
              <Button
                key={item}
                type="button"
                size="sm"
                variant={item === page ? "default" : "ghost"}
                aria-current={item === page ? "page" : undefined}
                aria-label={`Page ${item}`}
                disabled={disabled}
                onClick={() => onPageChange(item)}
                className="min-w-8"
              >
                {item}
              </Button>
            )
          )}
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled || page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          aria-label="Next page"
        >
          <span className="hidden sm:inline">Next</span> <ChevronRight className="size-4" />
        </Button>
      </nav>
    </div>
  );
}
