// Shared metric formatters. All display values flow through here so units stay
// consistent (km, bpm, h:m). Strava distances arrive in meters.

export function formatDistanceKm(meters: number | null | undefined): string {
  if (meters == null || Number.isNaN(meters)) return "—";
  const km = meters / 1000;
  return `${km.toFixed(2)} km`;
}

export function formatDuration(seconds: number | null | undefined): string {
  if (seconds == null || Number.isNaN(seconds) || seconds < 0) return "—";
  const total = Math.floor(seconds);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  return `${h}h ${m}m`;
}

// Running pace as m:ss per km (e.g. 300 → "5:00/km"). Non-positive / missing
// values render as a dash, matching the guard style of the other formatters.
export function formatPace(secPerKm: number | null | undefined): string {
  if (secPerKm == null || Number.isNaN(secPerKm) || secPerKm <= 0) return "—";
  const total = Math.round(secPerKm);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}/km`;
}

export function formatHr(bpm: number | null | undefined): string {
  if (bpm == null || Number.isNaN(bpm) || bpm <= 0) return "—";
  return `${Math.round(bpm)} bpm`;
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

export function formatTrainingLoad(load: number | null | undefined): string {
  if (load == null || Number.isNaN(load)) return "—";
  return load.toLocaleString("en-GB", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

// Round to at most 2 decimals for chart axes/tooltips, dropping trailing zeros
// (e.g. 45.3829 → "45.38", 45 → "45"). Used by recharts tickFormatter/formatter
// so the graphs don't render long float tails.
export function round2(value: number | string | null | undefined): string {
  const n = typeof value === "string" ? Number(value) : value;
  if (n == null || Number.isNaN(n)) return "—";
  return String(Math.round(n * 100) / 100);
}
