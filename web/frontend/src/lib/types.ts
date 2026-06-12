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
  // "strava" | "fit". The backend always sends it (null coerced to "strava" at the
  // boundary); optional here so existing Activity fixtures stay valid — no UI consumes
  // it yet (display is out of scope).
  source?: string;
}

// FIT import contracts mirrored from FitImportResponseDTO / FitImportItemDTO.
export type FitImportStatus = "imported" | "enriched" | "duplicate" | "failed";

export interface FitImportItem {
  filename: string;
  status: FitImportStatus;
  activityId: string | null;
  error: string | null;
}

export interface FitImportResponse {
  imported: number;
  enriched: number;
  duplicates: number;
  failed: number;
  results: FitImportItem[];
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

// The three theme settings the user can choose. "system" follows the OS.
export type ThemePreference = "light" | "dark" | "system";

// The UI languages the user can choose. Lowercase ISO-639-1 codes.
export type LanguagePreference = "en" | "es";

// The identity exposed to the browser. The JWT itself never leaves the server;
// the BFF keeps it in an httpOnly cookie.
export interface AuthUser {
  id: string;
  email: string;
  username: string;
  // Epoch millis of the last profile-photo upload, or null when none is set.
  // Drives whether an avatar image is rendered and serves as the ?v= cache-buster.
  photoUpdatedAt: number | null;
  // Stored UI theme. The backend always sends a concrete value (null → "system").
  themePreference: ThemePreference;
  // Stored UI language. The backend always sends a concrete value (null → "en").
  languagePreference: LanguagePreference;
}

// Backend register/login payload. `token` is consumed server-side only.
export interface BackendAuthResponse {
  token: string;
  expiresInSeconds: number;
  id: string;
  email: string;
  username: string;
  photoUpdatedAt: number | null;
  themePreference: ThemePreference;
  languagePreference: LanguagePreference;
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
  // Recommended weekly load: the chronic baseline (CTL x 7) entering the week scaled
  // by the target acute:chronic ratio. Plotted as a reference line over the bars.
  recommendedLoad: number;
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
