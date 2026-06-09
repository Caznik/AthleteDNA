import "server-only";

// Server-only fetch wrapper for the Spring Boot backend. Imported exclusively by
// Route Handlers (the BFF layer) so the browser never learns BACKEND_URL and no
// CORS configuration is required on Spring.

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:8080";

export class BackendError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    // Parsed JSON error body from the backend, when present. Lets callers relay
    // the backend's own error code/message (e.g. email_already_registered).
    public readonly body?: unknown,
  ) {
    super(message);
    this.name = "BackendError";
  }
}

export async function backendFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const url = `${BACKEND_URL}/${path.replace(/^\//, "")}`;
  const response = await fetch(url, {
    ...init,
    headers: {
      Accept: "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  const text = await response.text();
  // Guard the parse: a non-JSON body (HTML/proxy error page, plain-text 500)
  // must not throw a SyntaxError that masks the real upstream status.
  let parsed: unknown;
  if (text) {
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = text;
    }
  }

  if (!response.ok) {
    throw new BackendError(
      response.status,
      `Backend ${path} responded ${response.status}`,
      parsed,
    );
  }

  // 204 / empty body → return undefined cast to T.
  return parsed as T;
}

export function backendBaseUrl() {
  return BACKEND_URL;
}
