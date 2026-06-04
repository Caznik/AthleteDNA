// Name of the httpOnly cookie holding the backend JWT. Kept in its own module
// (no "server-only") so both the server-side auth helpers and the edge
// middleware can import it.
export const SESSION_COOKIE = "athletedna_session";
