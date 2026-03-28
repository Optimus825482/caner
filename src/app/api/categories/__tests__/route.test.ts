import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// --- Mocks ---
const {
  mockRequireAdminAuth,
  mockEnforceSameOrigin,
  mockBuildClientKey,
  mockEnforceRateLimit,
  mockCreateSiteSettingRateLimitAdapter,
  mockPrisma,
} = vi.hoisted(() => ({
  mockRequireAdminAuth: vi.fn(),
  mockEnforceSameOrigin: vi.fn(),
  mockBuildClientKey: vi.fn().mockReturnValue("client:key"),
  mockEnforceRateLimit: vi.fn().mockResolvedValue(null),
  mockCreateSiteSettingRateLimitAdapter: vi.fn().mockReturnValue({}),
  mockPrisma: {
    category: { findMany: vi.fn(), create: vi.fn() },
    siteSetting: {},
  },
}));

vi.mock("@/lib/auth", () => ({
  requireAdminAuth: () => mockRequireAdminAuth(),
}));
vi.mock("@/lib/request-guards", () => ({
  enforceSameOrigin: (req: NextRequest) => mockEnforceSameOrigin(req),
  buildClientKey: (...args: unknown[]) => mockBuildClientKey(...args),
  enforceRateLimit: (...args: unknown[]) => mockEnforceRateLimit(...args),
  createSiteSettingRateLimitAdapter: (...args: unknown[]) =>
    mockCreateSiteSettingRateLimitAdapter(...args),
}));
vi.mock("@/lib/prisma", () => ({ prisma: mockPrisma }));

import { GET, POST } from "../route";

function adminOk() {
  mockRequireAdminAuth.mockResolvedValue({
    ok: true,
    session: { user: { id: "u1", role: "admin" }, expires: "2099-01-01" },
  });
}

function adminDenied(status: number) {
  mockRequireAdminAuth.mockResolvedValue({
    ok: false,
    response: Response.json({ error: "Denied" }, { status }),
  });
}

function makeReq(
  method: string,
  body?: unknown,
  headers: Record<string, string> = {},
): NextRequest {
  const init = {
    method,
    headers: {
      "content-type": "application/json",
      origin: "http://localhost:3018",
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  };
  return new NextRequest(
    new URL("/api/categories", "http://localhost:3018"),
    init,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mockEnforceSameOrigin.mockReturnValue(null);
});

describe("GET /api/categories", () => {
  it("returns 401 when not authenticated", async () => {
    adminDenied(401);
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("returns categories when authenticated", async () => {
    adminOk();
    const cats = [
      {
        id: "c1",
        slug: "kitchens",
        order: 0,
        translations: [{ locale: "fr", name: "Cuisines" }],
        _count: { products: 3 },
      },
    ];
    mockPrisma.category.findMany.mockResolvedValue(cats);
    const res = await GET();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toEqual(cats);
  });
});

describe("POST /api/categories", () => {
  it("returns 403 when origin is denied", async () => {
    mockEnforceSameOrigin.mockReturnValue(
      Response.json({ error: "Forbidden origin" }, { status: 403 }),
    );
    const req = makeReq("POST", { slug: "test" });
    const res = await POST(req);
    expect(res.status).toBe(403);
  });

  it("returns 401 when not authenticated", async () => {
    adminDenied(401);
    const req = makeReq("POST", { slug: "test" });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("returns 400 for invalid body", async () => {
    adminOk();
    const req = makeReq("POST", { slug: "" });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("creates category with valid data", async () => {
    adminOk();
    const created = {
      id: "c1",
      slug: "wardrobes",
      order: 1,
      translations: [{ locale: "fr", name: "Armoires" }],
    };
    mockPrisma.category.create.mockResolvedValue(created);
    const req = makeReq("POST", {
      slug: "wardrobes",
      order: 1,
      translations: [{ locale: "fr", name: "Armoires" }],
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.slug).toBe("wardrobes");
  });

  it("returns 409 for duplicate slug (P2002)", async () => {
    adminOk();
    mockPrisma.category.create.mockRejectedValue({ code: "P2002" });
    const req = makeReq("POST", {
      slug: "kitchens",
      translations: [{ locale: "fr", name: "Cuisines" }],
    });
    const res = await POST(req);
    expect(res.status).toBe(409);
  });

  it("returns 429 when rate limited", async () => {
    adminOk();
    mockEnforceRateLimit.mockResolvedValue(
      Response.json({ error: "Too many" }, { status: 429 }),
    );
    const req = makeReq("POST", {
      slug: "test",
      translations: [{ locale: "fr", name: "Test" }],
    });
    const res = await POST(req);
    expect(res.status).toBe(429);
  });
});
