import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const { mockRequireAdminAuth, mockEnforceSameOrigin, mockPrisma } = vi.hoisted(
  () => ({
    mockRequireAdminAuth: vi.fn(),
    mockEnforceSameOrigin: vi.fn().mockReturnValue(null),
    mockPrisma: {
      heroSlide: {
        findMany: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        findUnique: vi.fn(),
        delete: vi.fn(),
      },
      heroSlideTranslation: { upsert: vi.fn() },
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

import { GET, POST, PUT, DELETE } from "../route";

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

function makeReq(
  method: string,
  body?: unknown,
  searchParams?: Record<string, string>,
): NextRequest {
  const reqUrl = new URL("/api/hero", "http://localhost:3018");
  if (searchParams) {
    for (const [k, v] of Object.entries(searchParams)) {
      reqUrl.searchParams.set(k, v);
    }
  }
  return new NextRequest(reqUrl, {
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
});

describe("GET /api/hero", () => {
  it("returns slides without auth", async () => {
    const slides = [
      { id: "s1", image: "/img.jpg", order: 0, active: true, translations: [] },
    ];
    mockPrisma.heroSlide.findMany.mockResolvedValue(slides);
    const res = await GET();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toHaveLength(1);
    expect(data[0].id).toBe("s1");
  });
});

describe("POST /api/hero", () => {
  it("returns 403 when origin denied", async () => {
    const { NextResponse } = require("next/server");
    mockEnforceSameOrigin.mockReturnValue(
      NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    );
    const req = makeReq("POST", { image: "/img.jpg" });
    const res = await POST(req);
    expect(res.status).toBe(403);
  });

  it("returns 401 when not authenticated", async () => {
    adminDenied(401);
    const req = makeReq("POST", { image: "/img.jpg" });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("returns 400 for invalid body", async () => {
    adminOk();
    const req = makeReq("POST", { image: "" });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("creates slide with valid data", async () => {
    adminOk();
    const created = {
      id: "s1",
      image: "/hero.jpg",
      order: 0,
      active: true,
      translations: [{ locale: "tr", title: "Baslik" }],
    };
    mockPrisma.heroSlide.create.mockResolvedValue(created);
    const req = makeReq("POST", {
      image: "/hero.jpg",
      translations: [{ locale: "tr", title: "Baslik" }],
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.image).toBe("/hero.jpg");
  });
});

describe("PUT /api/hero", () => {
  it("returns 401 when not authenticated", async () => {
    adminDenied(401);
    const req = makeReq("PUT", { id: "s1", image: "/img.jpg" });
    const res = await PUT(req);
    expect(res.status).toBe(401);
  });

  it("returns 400 for invalid body", async () => {
    adminOk();
    const req = makeReq("PUT", { id: "", image: "" });
    const res = await PUT(req);
    expect(res.status).toBe(400);
  });

  it("updates slide with translations", async () => {
    adminOk();
    const updated = {
      id: "s1",
      image: "/new.jpg",
      order: 1,
      active: true,
      translations: [{ locale: "tr", title: "Yeni" }],
    };
    mockPrisma.$transaction.mockResolvedValue([]);
    mockPrisma.heroSlide.findUnique.mockResolvedValue(updated);
    const req = makeReq("PUT", {
      id: "s1",
      image: "/new.jpg",
      order: 1,
      translations: [{ locale: "tr", title: "Yeni" }],
    });
    const res = await PUT(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.image).toBe("/new.jpg");
  });

  it("returns 404 when slide not found (P2025)", async () => {
    adminOk();
    mockPrisma.$transaction.mockRejectedValue({ code: "P2025" });
    const req = makeReq("PUT", { id: "nope", image: "/img.jpg" });
    const res = await PUT(req);
    expect(res.status).toBe(404);
  });
});

describe("DELETE /api/hero", () => {
  it("returns 401 when not authenticated", async () => {
    adminDenied(401);
    const req = makeReq("DELETE", undefined, { id: "s1" });
    const res = await DELETE(req);
    expect(res.status).toBe(401);
  });

  it("returns 400 when id missing", async () => {
    adminOk();
    const req = makeReq("DELETE");
    const res = await DELETE(req);
    expect(res.status).toBe(400);
  });

  it("deletes slide successfully", async () => {
    adminOk();
    mockPrisma.heroSlide.delete.mockResolvedValue({ id: "s1" });
    const req = makeReq("DELETE", undefined, { id: "s1" });
    const res = await DELETE(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
  });

  it("returns 404 when slide not found", async () => {
    adminOk();
    mockPrisma.heroSlide.delete.mockRejectedValue({ code: "P2025" });
    const req = makeReq("DELETE", undefined, { id: "s1" });
    const res = await DELETE(req);
    expect(res.status).toBe(404);
  });
});
