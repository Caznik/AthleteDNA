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
  return (
    <Table data-testid="personal-records-table">
      <TableHeader>
        <TableRow>
          <TableHead>Type</TableHead>
          <TableHead>Max distance</TableHead>
          <TableHead>Max duration</TableHead>
          <TableHead>Best pace</TableHead>
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
