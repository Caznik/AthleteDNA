"use client";

import { useTranslation } from "react-i18next";

import { MetricInfo } from "@/components/metric-info";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDistanceKm, formatDuration, formatPace } from "@/lib/format";
import type { PersonalRecord } from "@/lib/types";

// All-time personal records per activity type. Distances/durations reuse the
// shared formatters for cross-screen consistency; pace uses the new formatPace
// (null → "—").
export function PersonalRecordsTable({
  records,
}: {
  records: PersonalRecord[];
}) {
  const { t } = useTranslation();
  return (
    <Table data-testid="personal-records-table">
      <TableHeader>
        <TableRow>
          <TableHead>{t("activities.table.type")}</TableHead>
          <TableHead>
            <span className="flex items-center gap-1.5">
              {t("insights.pr.maxDistance")}
              <MetricInfo id="prDistance" />
            </span>
          </TableHead>
          <TableHead>
            <span className="flex items-center gap-1.5">
              {t("insights.pr.maxDuration")}
              <MetricInfo id="prDuration" />
            </span>
          </TableHead>
          <TableHead>
            <span className="flex items-center gap-1.5">
              {t("insights.pr.bestPace")}
              <MetricInfo id="prPace" />
            </span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {records.map((r) => (
          <TableRow key={r.type}>
            <TableCell>{r.type}</TableCell>
            <TableCell>{formatDistanceKm(r.maxDistance)}</TableCell>
            <TableCell>{formatDuration(r.maxDuration)}</TableCell>
            <TableCell>{formatPace(r.bestPaceSecPerKm)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
