"use client";

import { useMemo, useState, type ReactNode } from "react";

export interface DataTableColumn<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  sortValue?: (row: T) => number | string;
  align?: "left" | "right";
}

interface Props<T> {
  columns: DataTableColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  defaultSortKey?: string;
  defaultSortDir?: "asc" | "desc";
}

export default function DataTable<T>({ columns, rows, rowKey, defaultSortKey, defaultSortDir = "desc" }: Props<T>) {
  const [sortKey, setSortKey] = useState<string | undefined>(defaultSortKey ?? columns[0]?.key);
  const [sortDir, setSortDir] = useState<"asc" | "desc">(defaultSortDir);

  const sortedRows = useMemo(() => {
    const column = columns.find((c) => c.key === sortKey);
    if (!column?.sortValue) return rows;
    const copy = [...rows];
    copy.sort((a, b) => {
      const av = column.sortValue!(a);
      const bv = column.sortValue!(b);
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return copy;
  }, [rows, columns, sortKey, sortDir]);

  function toggleSort(key: string) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  return (
    <div className="overflow-x-auto rounded-[16px] border border-border bg-surface scrollbar-thin-accent">
      <table className="w-full min-w-[760px] border-collapse text-[12.5px]">
        <thead>
          <tr className="border-b border-border bg-surface-2">
            {columns.map((col) => (
              <th
                key={col.key}
                className={`whitespace-nowrap px-3.5 py-3 text-[10.5px] font-bold uppercase tracking-wide text-muted-2 ${
                  col.align === "right" ? "text-right" : "text-left"
                }`}
              >
                {col.sortValue ? (
                  <button
                    type="button"
                    onClick={() => toggleSort(col.key)}
                    className={`inline-flex items-center gap-1 transition hover:text-text ${
                      sortKey === col.key ? "text-accent-2" : ""
                    }`}
                  >
                    {col.header}
                    {sortKey === col.key && <span>{sortDir === "asc" ? "↑" : "↓"}</span>}
                  </button>
                ) : (
                  col.header
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedRows.map((row) => (
            <tr key={rowKey(row)} className="border-b border-border/60 last:border-0 hover:bg-surface-2/60">
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={`whitespace-nowrap px-3.5 py-3 text-text ${col.align === "right" ? "text-right" : "text-left"}`}
                >
                  {col.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
