import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const { mockRequireAdminAuth, mockEnforceSameOrigin, mockPrisma } = vi.hoisted(
  () => ({
    mockRequireAdminAuth: vi.fn(),
    mockEnforceSameOrigin: vi.fn().mockReturnValue(null),
    mockPrisma: {
      category: { update: vi.fn(), findUnique: vi.fn(), delete: vi.fn() },
      categoryTranslation: { upsert: vi.fn() },
      $transaction: vi.fn(),
    },
  }),
);

vi.mock("@/lib/auth", () => ({
  requireAdminAuth: () => mockRequireAdminAuth(),
}));
vi.mock("@/lib/request-guards", () => ({
  enforceSameOrigin: (req: NextRequest) => mockEnforceSameOrigin(req),
}));
vi.mock("@/lib/prisma", () => ({ prisma: mockPrisma }));

import { PUT, DELETE } from "../route";

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
  const init = {
    method,
    headers: {
      "content-type": "application/json",
      origin: "http://localhost:3018",
    },
    body: body ? JSON.stringify(body) : undefined,
  };
  return new NextRequest(
    new URL("/api/categories/cat1", "http://localhost:3018"),
    init,
  );
}

const params = Promise.resolve({ id: "cat1" });

beforeEach(() => {
  vi.clearAllMocks();
  mockEnforceSameOrigin.mockReturnValue(null);
});

describe("PUT /api/categories/[id]", () => {
  it("returns 401 when not authenticated", async () => {
    adminDenied(401);
    const req = makeReq("PUT", { slug: "test" });
    const res = await PUT(req, { params });
    expect(res.status).toBe(401);
  });

  it("returns 400 for invalid body", async () => {
    adminOk();
    const req = makeReq("PUT", { slug: "" });
    const res = await PUT(req, { params });
    expect(res.status).toBe(400);
  });

  it("updates category with valid data", async () => {
    adminOk();
    const updated = { id: "cat1", slug: "updated", order: 2, translations: [] };
    mockPrisma.$transaction.mockResolvedValue([updated]);
    mockPrisma.category.findUnique.mockResolvedValue(updated);
    const req = makeReq("PUT", { slug: "updated", order: 2 });
    const res = await PUT(req, { params });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.slug).toBe("updated");
  });

  it("returns 404 when category not found (P2025)", async () => {
    adminOk();
    mockPrisma.$transaction.mockRejectedValue({ code: "P2025" });
    const req = makeReq("PUT", { slug: "nope" });
    const res = await PUT(req, { params });
    expect(res.status).toBe(404);
  });
});

describe("DELETE /api/categories/[id]", () => {
  it("returns 401 when not authenticated", async () => {
    adminDenied(401);
    const req = makeReq("DELETE");
    const res = await DELETE(req, { params });
    expect(res.status).toBe(401);
  });

  it("deletes category successfully", async () => {
    adminOk();
    mockPrisma.category.delete.mockResolvedValue({ id: "cat1" });
    const req = makeReq("DELETE");
    const res = await DELETE(req, { params });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
  });

  it("returns 404 when category not found", async () => {
    adminOk();
    mockPrisma.category.delete.mockRejectedValue({ code: "P2025" });
    const req = makeReq("DELETE");
    const res = await DELETE(req, { params });
    expect(res.status).toBe(404);
  });
});
