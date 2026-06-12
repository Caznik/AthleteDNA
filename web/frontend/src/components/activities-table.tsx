"use client";

import { useTranslation } from "react-i18next";

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
  // The "All" sentinel value within `types`, rendered with a translated label
  // (the activity-type names themselves are backend data and stay untranslated).
  allValue: string;
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
  allValue,
  typeFilter,
  onTypeChange,
  page,
  size,
  total,
  totalPages,
  onPageChange,
}: ActivitiesTableProps) {
  const { t } = useTranslation();
  const firstRow = total === 0 ? 0 : page * size + 1;
  const lastRow = page * size + rows.length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2" data-testid="type-filter">
        {types.map((type) => (
          <Button
            key={type}
            size="sm"
            variant={type === typeFilter ? "default" : "outline"}
            onClick={() => onTypeChange(type)}
          >
            {type === allValue ? t("activities.all") : type}
          </Button>
        ))}
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("activities.table.type")}</TableHead>
            <TableHead>{t("activities.table.date")}</TableHead>
            <TableHead>{t("activities.table.distance")}</TableHead>
            <TableHead>{t("activities.table.duration")}</TableHead>
            <TableHead>{t("activities.table.avgHr")}</TableHead>
            <TableHead>{t("activities.table.trainingLoad")}</TableHead>
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
            {t("activities.table.showing", {
              first: firstRow,
              last: lastRow,
              total,
            })}
          </p>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 0}
            >
              {t("common.previous")}
            </Button>
            <span className="text-sm text-muted-foreground">
              {t("activities.table.page", { page: page + 1, total: totalPages })}
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages - 1}
            >
              {t("common.next")}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
