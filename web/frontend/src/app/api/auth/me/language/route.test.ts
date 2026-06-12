import { beforeEach, describe, expect, it, vi } from "vitest";

import { PUT } from "./route";

// Mock the server-only session helpers and the backend fetch wrapper. The route
// must (a) relay the backend's 400 error CODE to the client and (b) clear the
// session cookie on a 401 (AC-4). Hoisted so the mock factories (lifted to the
// top of the module) can reference them without a TDZ error.
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
    backendFetch: vi.fn(),
    BackendError,
  };
});
const { getSessionToken, clearSessionCookie, backendFetch, BackendError } = h;

vi.mock("@/lib/auth", () => ({
  getSessionToken: () => h.getSessionToken(),
  clearSessionCookie: () => h.clearSessionCookie(),
}));

vi.mock("@/lib/backend", () => ({
  backendFetch: (path: string, init?: RequestInit) => h.backendFetch(path, init),
  BackendError: h.BackendError,
}));

function request(body: unknown) {
  return new Request("http://localhost/api/auth/me/language", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("PUT /api/auth/me/language (BFF)", () => {
  beforeEach(() => {
    getSessionToken.mockReset();
    clearSessionCookie.mockReset();
    backendFetch.mockReset();
  });

  it("returns 401 with an unauthorized code when there is no session", async () => {
    getSessionToken.mockResolvedValue(undefined);

    const res = await PUT(request({ language: "es" }));

    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: "unauthorized" });
    expect(backendFetch).not.toHaveBeenCalled();
  });

  it("relays the updated user on success", async () => {
    getSessionToken.mockResolvedValue("jwt");
    const user = { id: "u1", languagePreference: "es" };
    backendFetch.mockResolvedValue(user);

    const res = await PUT(request({ language: "es" }));

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(user);
  });

  it("exposes the backend 400 error CODE to the client (AC-4)", async () => {
    getSessionToken.mockResolvedValue("jwt");
    backendFetch.mockRejectedValue(
      new BackendError(400, "bad", { error: "invalid_language", message: "nope" }),
    );

    const res = await PUT(request({ language: "fr" }));

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "invalid_language" });
  });

  it("clears the session cookie and returns 401 on a backend 401 (AC-4)", async () => {
    getSessionToken.mockResolvedValue("jwt");
    backendFetch.mockRejectedValue(new BackendError(401, "unauth", { error: "unauthorized" }));

    const res = await PUT(request({ language: "es" }));

    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: "unauthorized" });
    expect(clearSessionCookie).toHaveBeenCalledTimes(1);
  });
});
