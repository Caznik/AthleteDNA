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
