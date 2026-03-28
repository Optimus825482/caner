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
    product: { findMany: vi.fn(), create: vi.fn() },
    siteSetting: {},
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

function makeReq(method: string, body?: unknown): NextRequest {
  const init = {
    method,
    headers: {
      "content-type": "application/json",
      origin: "http://localhost:3018",
    },
    body: body ? JSON.stringify(body) : undefined,
  };
  return new NextRequest(
    new URL("/api/products", "http://localhost:3018"),
    init,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mockEnforceSameOrigin.mockReturnValue(null);
  mockEnforceRateLimit.mockResolvedValue(null);
});

describe("GET /api/products", () => {
  it("returns 401 when not authenticated", async () => {
    adminDenied(401);
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("returns products list", async () => {
    adminOk();
    const products = [
      {
        id: "p1",
        slug: "kitchen-modern",
        featured: true,
        order: 0,
        translations: [{ locale: "fr", title: "Cuisine Moderne" }],
        images: [],
        category: { slug: "kitchens", translations: [] },
      },
    ];
    mockPrisma.product.findMany.mockResolvedValue(products);
    const res = await GET();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toHaveLength(1);
    expect(data[0].slug).toBe("kitchen-modern");
  });
});

describe("POST /api/products", () => {
  it("returns 401 when not authenticated", async () => {
    adminDenied(401);
    const req = makeReq("POST", { slug: "test" });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("returns 400 for missing required fields", async () => {
    adminOk();
    const req = makeReq("POST", { slug: "test" });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("creates product with valid data", async () => {
    adminOk();
    const created = {
      id: "p1",
      slug: "new-product",
      featured: false,
      order: 0,
      translations: [{ locale: "fr", title: "Nouveau" }],
      images: [],
    };
    mockPrisma.product.create.mockResolvedValue(created);
    const req = makeReq("POST", {
      slug: "new-product",
      categoryId: "cat1",
      translations: [{ locale: "fr", title: "Nouveau" }],
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.slug).toBe("new-product");
  });

  it("returns 409 for duplicate slug", async () => {
    adminOk();
    mockPrisma.product.create.mockRejectedValue({ code: "P2002" });
    const req = makeReq("POST", {
      slug: "existing",
      categoryId: "cat1",
      translations: [{ locale: "fr", title: "Existing" }],
    });
    const res = await POST(req);
    expect(res.status).toBe(409);
  });

  it("returns 422 for invalid category reference", async () => {
    adminOk();
    mockPrisma.product.create.mockRejectedValue({ code: "P2003" });
    const req = makeReq("POST", {
      slug: "test",
      categoryId: "nonexistent",
      translations: [{ locale: "fr", title: "Test" }],
    });
    const res = await POST(req);
    expect(res.status).toBe(422);
  });

  it("returns 403 when origin denied", async () => {
    mockEnforceSameOrigin.mockReturnValue(
      Response.json({ error: "Forbidden" }, { status: 403 }),
    );
    const req = makeReq("POST", { slug: "test" });
    const res = await POST(req);
    expect(res.status).toBe(403);
  });
});
