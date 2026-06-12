import { beforeEach, describe, expect, it, vi } from "vitest";

import { POST } from "./route";

// Mock the server-only session helpers + the authed backend fetch wrapper. The route
// must (a) 401 with no session before touching the backend, (b) relay the import
// summary on success, and (c) clear the cookie on a backend 401.
const h = vi.hoisted(() => {
  class BackendError extends Error {
    constructor(
      public readonly status: number,
      message: string,
      public readonly body?: unknown,
    ) {
      super(message);
      this.name = "BackendError";
    }
  }
  return {
    getSessionToken: vi.fn(),
    clearSessionCookie: vi.fn(),
    authedBackendFetch: vi.fn(),
    BackendError,
  };
});
const { getSessionToken, clearSessionCookie, authedBackendFetch, BackendError } = h;

vi.mock("@/lib/auth", () => ({
  getSessionToken: () => h.getSessionToken(),
  clearSessionCookie: () => h.clearSessionCookie(),
  authedBackendFetch: (path: string, init?: RequestInit) =>
    h.authedBackendFetch(path, init),
}));

vi.mock("@/lib/backend", () => ({
  BackendError: h.BackendError,
}));

// A stub request whose formData() resolves synchronously. Building a real Request with a
// multipart body and parsing it via undici's formData() hangs under jsdom, so we bypass
// that and only exercise what the route uses: getSessionToken → formData → backend fetch.
function multipartRequest(): Request {
  const body = new FormData();
  body.append("files", new Blob([new Uint8Array([1, 2, 3])]), "run.fit");
  return { formData: async () => body } as unknown as Request;
}

describe("POST /api/fit/import (BFF)", () => {
  beforeEach(() => {
    getSessionToken.mockReset();
    clearSessionCookie.mockReset();
    authedBackendFetch.mockReset();
  });

  it("returns 401 without a session and never calls the backend", async () => {
    getSessionToken.mockResolvedValue(undefined);

    const res = await POST(multipartRequest());

    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: "unauthorized" });
    expect(authedBackendFetch).not.toHaveBeenCalled();
  });

  it("relays the import summary on success (AC-10)", async () => {
    getSessionToken.mockResolvedValue("jwt");
    const summary = {
      imported: 1,
      enriched: 0,
      duplicates: 0,
      failed: 1,
      results: [
        { filename: "run.fit", status: "imported", activityId: "a1", error: null },
        { filename: "bad.fit", status: "failed", activityId: null, error: "Not a valid FIT file" },
      ],
    };
    authedBackendFetch.mockResolvedValue(summary);

    const res = await POST(multipartRequest());

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(summary);
    expect(authedBackendFetch).toHaveBeenCalledWith(
      "api/fit/import",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("clears the session cookie and returns 401 on a backend 401", async () => {
    getSessionToken.mockResolvedValue("jwt");
    authedBackendFetch.mockRejectedValue(new BackendError(401, "unauth", { error: "unauthorized" }));

    const res = await POST(multipartRequest());

    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: "unauthorized" });
    expect(clearSessionCookie).toHaveBeenCalledTimes(1);
  });
});
