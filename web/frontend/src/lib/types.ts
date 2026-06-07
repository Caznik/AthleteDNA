// Contracts mirrored from the Spring Boot backend (ActivityDTO and Strava endpoints).
// `distance` is the raw value stored by the backend (Strava reports meters);
// formatters convert to km for display.

export interface Activity {
  id: string | null;
  type: string;
  distance: number | null;
  duration: number | null; // seconds
  avgHr: number | null; // bpm
  externalStravaId: number | null;
  startDate: string | null; // ISO-8601 instant
  trainingLoad: number | null; // duration(sec) * avgHr
}

// One page of activities from the backend's paged endpoint. Mirrors ActivityPageDTO.
export interface ActivityPage {
  items: Activity[];
  total: number;
  page: number; // 0-indexed, matching the backend
  size: number;
  totalPages: number;
}

export interface ConnectResponse {
  authorizationUrl: string;
}

export interface StatusResponse {
  linked: boolean;
}

export interface SyncResponse {
  synced: number;
}

// --- Auth ---

export interface Credentials {
  email: string;
  password: string;
}

// Registration also carries a chosen username (max 15 chars).
export interface RegisterCredentials extends Credentials {
  username: string;
}

// Profile self-service: changing the password requires proving the current one.
export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

// The identity exposed to the browser. The JWT itself never leaves the server;
// the BFF keeps it in an httpOnly cookie.
export interface AuthUser {
  id: string;
  email: string;
  username: string;
  // Epoch millis of the last profile-photo upload, or null when none is set.
  // Drives whether an avatar image is rendered and serves as the ?v= cache-buster.
  photoUpdatedAt: number | null;
}

// Backend register/login payload. `token` is consumed server-side only.
export interface BackendAuthResponse {
  token: string;
  expiresInSeconds: number;
  id: string;
  email: string;
  username: string;
  photoUpdatedAt: number | null;
}

// --- Training insights ---
// Mirrors the Spring TrainingInsightsResponse (which mirrors the Python engine's
// camelCase wire contract). No UI consumes these yet; the dashboard sub-feature
// will. Dates are ISO-8601 calendar dates ("2026-06-01").

// One day of the Performance Management Chart series.
export interface InsightSeriesPoint {
  date: string;
  load: number;
  ctl: number; // fitness (42-day EWMA)
  atl: number; // fatigue (7-day EWMA)
  tsb: number; // form (yesterday's ctl - atl)
}

// Latest fitness/fatigue/form snapshot. formLabel ∈ "fresh" | "neutral" | "fatigued".
export interface InsightCurrentForm {
  ctl: number;
  atl: number;
  tsb: number;
  formLabel: string;
}

export interface InsightPmc {
  series: InsightSeriesPoint[];
  current: InsightCurrentForm;
}

export interface WeeklyLoadPoint {
  weekStart: string; // Monday of the ISO week
  load: number;
}

// tsbDirection ∈ "rising" | "falling" | "flat".
export interface InsightTrends {
  ctlRampPerWeek: number;
  tsbDirection: string;
}

export interface PersonalRecord {
  type: string;
  maxDistance: number; // meters
  maxDuration: number; // seconds
  bestPaceSecPerKm: number | null; // null when no distance-bearing activity
}

export interface TrainingInsights {
  pmc: InsightPmc;
  weeklyLoad: WeeklyLoadPoint[];
  trends: InsightTrends;
  prs: PersonalRecord[];
}
