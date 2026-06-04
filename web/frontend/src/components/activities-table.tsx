"use client";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  formatDate,
  formatDistanceKm,
  formatDuration,
  formatHr,
  formatTrainingLoad,
} from "@/lib/format";
import type { Activity } from "@/lib/types";

// Presentational table: rows, filtering, and paging are all decided by the
// parent (and ultimately the backend). This component just renders the current
// page and reports user intent (filter/page changes) back up.
export interface ActivitiesTableProps {
  rows: Activity[];
  // Filter buttons; the parent supplies the choices (incl. the "All" sentinel).
  types: string[];
  typeFilter: string;
  onTypeChange: (type: string) => void;
  // 0-indexed page, matching the backend.
  page: number;
  size: number;
  total: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function ActivitiesTable({
  rows,
  types,
  typeFilter,
  onTypeChange,
  page,
  size,
  total,
  totalPages,
  onPageChange,
}: ActivitiesTableProps) {
  const firstRow = total === 0 ? 0 : page * size + 1;
  const lastRow = page * size + rows.length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2" data-testid="type-filter">
        {types.map((t) => (
          <Button
            key={t}
            size="sm"
            variant={t === typeFilter ? "default" : "outline"}
            onClick={() => onTypeChange(t)}
          >
            {t}
          </Button>
        ))}
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Type</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Distance</TableHead>
            <TableHead>Duration</TableHead>
            <TableHead>Avg HR</TableHead>
            <TableHead>Training load</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((a) => (
            <TableRow key={a.id ?? `${a.externalStravaId}`}>
              <TableCell className="font-medium">{a.type}</TableCell>
              <TableCell>{formatDate(a.startDate)}</TableCell>
              <TableCell>{formatDistanceKm(a.distance)}</TableCell>
              <TableCell>{formatDuration(a.duration)}</TableCell>
              <TableCell>{formatHr(a.avgHr)}</TableCell>
              <TableCell>{formatTrainingLoad(a.trainingLoad)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {totalPages > 1 ? (
        <div
          className="flex items-center justify-between"
          data-testid="pagination"
        >
          <p className="text-sm text-muted-foreground">
            Showing {firstRow}–{lastRow} of {total}
          </p>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 0}
            >
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {page + 1} of {totalPages}
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages - 1}
            >
              Next
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
