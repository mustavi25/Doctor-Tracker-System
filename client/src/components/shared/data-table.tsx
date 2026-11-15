"use client";

import { memo } from "react";
import { cn } from "@/lib/utils";

export interface Column<T> {
  id: string;
  header: React.ReactNode;
  cell: (row: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  getRowId: (row: T) => string;
  /** If provided, screens below `md` show a card list instead of the table */
  renderMobileCard?: (row: T) => React.ReactNode;
  isLoading?: boolean;
  isFetching?: boolean;
  skeletonRows?: number;
  /** Rendered instead of the table when there are no rows */
  empty?: React.ReactNode;
  /** Pagination etc., rendered inside the card under the rows */
  footer?: React.ReactNode;
}

function DataRow<T>({ row, columns }: { row: T; columns: Column<T>[] }) {
  return (
    <tr className="border-b transition-colors last:border-0 hover:bg-muted/40">
      {columns.map((c) => (
        <td key={c.id} className={cn("px-4 py-3 align-middle", c.className)}>
          {c.cell(row)}
        </td>
      ))}
    </tr>
  );
}
// memo() erases generics; the cast restores them. Rows re-render only when their data changes.
const MemoDataRow = memo(DataRow) as typeof DataRow;

function MobileItem<T>({ row, render }: { row: T; render: (row: T) => React.ReactNode }) {
  return <li className="p-4">{render(row)}</li>;
}
const MemoMobileItem = memo(MobileItem) as typeof MobileItem;

export function DataTable<T>({
  columns,
  rows,
  getRowId,
  renderMobileCard,
  isLoading,
  isFetching,
  skeletonRows = 8,
  empty,
  footer,
}: DataTableProps<T>) {
  const refreshing = !!isFetching && !isLoading;
  const showEmpty = !isLoading && rows.length === 0;

  return (
    <div className="relative overflow-hidden rounded-xl border bg-card shadow-sm" aria-busy={!!isFetching}>
      {refreshing && <div className="absolute inset-x-0 top-0 z-10 h-0.5 animate-pulse bg-primary" aria-hidden />}

      {showEmpty ? (
        empty
      ) : (
        <>
          <div className={cn("overflow-x-auto", renderMobileCard && "hidden md:block")}>
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/50 text-left text-xs font-medium tracking-wide text-muted-foreground uppercase">
                <tr>
                  {columns.map((c) => (
                    <th key={c.id} scope="col" className="px-4 py-3 whitespace-nowrap">
                      {c.header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className={cn("transition-opacity", refreshing && "opacity-60")}>
                {isLoading
                  ? Array.from({ length: skeletonRows }, (_, i) => (
                      <tr key={i} className="border-b last:border-0">
                        {columns.map((c) => (
                          <td key={c.id} className="px-4 py-4">
                            <div className="h-4 w-full max-w-32 animate-pulse rounded bg-muted" />
                          </td>
                        ))}
                      </tr>
                    ))
                  : rows.map((row) => <MemoDataRow key={getRowId(row)} row={row} columns={columns} />)}
              </tbody>
            </table>
          </div>

          {renderMobileCard && (
            <ul className={cn("divide-y md:hidden", refreshing && "opacity-60 transition-opacity")}>
              {isLoading
                ? Array.from({ length: 4 }, (_, i) => (
                    <li key={i} className="space-y-3 p-4">
                      <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
                      <div className="h-3 w-3/4 animate-pulse rounded bg-muted" />
                      <div className="h-3 w-1/3 animate-pulse rounded bg-muted" />
                    </li>
                  ))
                : rows.map((row) => <MemoMobileItem key={getRowId(row)} row={row} render={renderMobileCard} />)}
            </ul>
          )}

          {footer && <div className="border-t">{footer}</div>}
        </>
      )}
    </div>
  );
}
