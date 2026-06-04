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
  return Math.round(load).toLocaleString("en-GB");
}
