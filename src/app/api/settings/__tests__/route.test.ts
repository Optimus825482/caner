import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const {
  mockRequireAdminAuth,
  mockEnforceSameOrigin,
  mockBuildClientKey,
  mockEnforceRateLimit,
  mockCreateAdapter,
  mockPrisma,
} = vi.hoisted(() => ({
  mockRequireAdminAuth: vi.fn(),
  mockEnforceSameOrigin: vi.fn().mockReturnValue(null),
  mockBuildClientKey: vi.fn().mockReturnValue("client:key"),
  mockEnforceRateLimit: vi.fn().mockResolvedValue(null),
  mockCreateAdapter: vi.fn().mockReturnValue({}),
  mockPrisma: {
    siteSetting: { findMany: vi.fn(), upsert: vi.fn() },
  },
}));

vi.mock("@/lib/auth", () => ({
  requireAdminAuth: () => mockRequireAdminAuth(),
}));
vi.mock("@/lib/request-guards", () => ({
  enforceSameOrigin: (req: NextRequest) => mockEnforceSameOrigin(req),
  buildClientKey: (...a: unknown[]) => mockBuildClientKey(...a),
  enforceRateLimit: (...a: unknown[]) => mockEnforceRateLimit(...a),
  createSiteSettingRateLimitAdapter: (...a: unknown[]) =>
    mockCreateAdapter(...a),
}));
vi.mock("@/lib/prisma", () => ({ prisma: mockPrisma }));

import { GET, PUT } from "../route";

function adminOk() {
  mockRequireAdminAuth.mockResolvedValue({
    ok: true,
    session: { user: { id: "u1", role: "admin" }, expires: "2099-01-01" },
  });
}

function adminDenied(status: number) {
  const { NextResponse } = require("next/server");
  mockRequireAdminAuth.mockResolvedValue({
    ok: false,
    response: NextResponse.json({ error: "Denied" }, { status }),
  });
}

function makeReq(method: string, body?: unknown): NextRequest {
  return new NextRequest(new URL("/api/settings", "http://localhost:3018"), {
    method,
    headers: {
      "content-type": "application/json",
      origin: "http://localhost:3018",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockEnforceSameOrigin.mockReturnValue(null);
  mockEnforceRateLimit.mockResolvedValue(null);
});

describe("GET /api/settings", () => {
  it("returns 401 when not authenticated", async () => {
    adminDenied(401);
    const req = makeReq("GET");
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it("returns settings as key-value map", async () => {
    adminOk();
    mockPrisma.siteSetting.findMany.mockResolvedValue([
      { id: "1", key: "site_name", value: "Arvesta" },
      { id: "2", key: "phone", value: "+33 1 23" },
    ]);
    const req = makeReq("GET");
    const res = await GET(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.site_name).toBe("Arvesta");
    expect(data.phone).toBe("+33 1 23");
  });
});

describe("PUT /api/settings", () => {
  it("returns 401 when not authenticated", async () => {
    adminDenied(401);
    const req = makeReq("PUT", { site_name: "Test" });
    const res = await PUT(req);
    expect(res.status).toBe(401);
  });

  it("returns 400 for invalid body", async () => {
    adminOk();
    // Empty key is invalid
    const req = makeReq("PUT", { "": "value" });
    const res = await PUT(req);
    expect(res.status).toBe(400);
  });

  it("upserts settings with valid data", async () => {
    adminOk();
    mockPrisma.siteSetting.upsert.mockResolvedValue({});
    const req = makeReq("PUT", {
      site_name: "Arvesta Updated",
      phone: "+33 9 99",
    });
    const res = await PUT(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(mockPrisma.siteSetting.upsert).toHaveBeenCalledTimes(2);
  });

  it("returns 429 when rate limited", async () => {
    adminOk();
    const { NextResponse } = require("next/server");
    mockEnforceRateLimit.mockResolvedValue(
      NextResponse.json({ error: "Too many" }, { status: 429 }),
    );
    const req = makeReq("PUT", { site_name: "Test" });
    const res = await PUT(req);
    expect(res.status).toBe(429);
  });
});
