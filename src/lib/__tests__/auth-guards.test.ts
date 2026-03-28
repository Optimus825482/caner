import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Session } from "next-auth";

const { mockAuth, mockRedirect } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockRedirect: vi.fn(),
}));

vi.mock("next-auth", () => ({
  __esModule: true,
  default: () => ({
    handlers: {},
    auth: mockAuth,
    signIn: vi.fn(),
    signOut: vi.fn(),
  }),
}));

vi.mock("bcryptjs", () => ({ compare: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
  prisma: { adminUser: { findUnique: vi.fn() } },
}));

vi.mock("next/navigation", () => ({
  redirect: (...args: unknown[]) => {
    mockRedirect(...args);
    throw new Error("NEXT_REDIRECT");
  },
}));

import {
  requireAuth,
  requireRole,
  requireAdminAuth,
  requireAdminPageSession,
} from "../auth";

function makeSession(role?: string): Session {
  return {
    user: { id: "u1", name: "Admin", role },
    expires: new Date(Date.now() + 86400000).toISOString(),
  } as Session;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("requireAuth", () => {
  it("returns ok:false with 401 when no session", async () => {
    mockAuth.mockResolvedValue(null);
    const result = await requireAuth();
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.response.status).toBe(401);
  });

  it("returns ok:false with 401 when session has no user", async () => {
    mockAuth.mockResolvedValue({ expires: "2099-01-01" });
    const result = await requireAuth();
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.response.status).toBe(401);
  });

  it("returns ok:true with session when authenticated", async () => {
    const session = makeSession("admin");
    mockAuth.mockResolvedValue(session);
    const result = await requireAuth();
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.session.user.id).toBe("u1");
  });
});

describe("requireRole", () => {
  it("returns null when role matches", () => {
    const session = makeSession("admin");
    const result = requireRole(session, "admin");
    expect(result).toBeNull();
  });

  it("returns 403 when role does not match", () => {
    const session = makeSession("user");
    const result = requireRole(session, "admin");
    expect(result).not.toBeNull();
    expect(result!.status).toBe(403);
  });

  it("returns 403 when user has no role", () => {
    const session = makeSession(undefined);
    const result = requireRole(session, "admin");
    expect(result).not.toBeNull();
    expect(result!.status).toBe(403);
  });
});

describe("requireAdminAuth", () => {
  it("returns ok:false with 401 when not authenticated", async () => {
    mockAuth.mockResolvedValue(null);
    const result = await requireAdminAuth();
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.response.status).toBe(401);
  });

  it("returns ok:false with 403 when not admin", async () => {
    const session = makeSession("user");
    mockAuth.mockResolvedValue(session);
    const result = await requireAdminAuth();
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.response.status).toBe(403);
  });

  it("returns ok:true when admin", async () => {
    const session = makeSession("admin");
    mockAuth.mockResolvedValue(session);
    const result = await requireAdminAuth();
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.session.user.role).toBe("admin");
  });
});

describe("requireAdminPageSession", () => {
  it("redirects to login when no session", async () => {
    mockAuth.mockResolvedValue(null);
    await expect(requireAdminPageSession()).rejects.toThrow("NEXT_REDIRECT");
    expect(mockRedirect).toHaveBeenCalledWith("/admin/login");
  });

  it("redirects to / when not admin", async () => {
    const session = makeSession("user");
    mockAuth.mockResolvedValue(session);
    await expect(requireAdminPageSession()).rejects.toThrow("NEXT_REDIRECT");
    expect(mockRedirect).toHaveBeenCalledWith("/");
  });

  it("returns session when admin", async () => {
    const session = makeSession("admin");
    mockAuth.mockResolvedValue(session);
    const result = await requireAdminPageSession();
    expect(result.user.id).toBe("u1");
    expect(result.user.role).toBe("admin");
  });
});
