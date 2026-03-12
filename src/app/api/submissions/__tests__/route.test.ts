import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const { mockRequireAdminAuth, mockEnforceSameOrigin, mockPrisma } = vi.hoisted(
  () => ({
    mockRequireAdminAuth: vi.fn(),
    mockEnforceSameOrigin: vi.fn().mockReturnValue(null),
    mockPrisma: {
      contactSubmission: {
        update: vi.fn(),
        updateMany: vi.fn(),
        deleteMany: vi.fn(),
      },
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

// Import individual route handlers
import { PATCH as patchSingle } from "../../submissions/[id]/route";
import {
  PATCH as patchBulk,
  DELETE as deleteBulk,
} from "../../submissions/bulk/route";

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
  return new NextRequest(
    new URL("/api/submissions/sub1", "http://localhost:3018"),
    {
      method,
      headers: {
        "content-type": "application/json",
        origin: "http://localhost:3018",
      },
      body: body ? JSON.stringify(body) : undefined,
    },
  );
}

const singleParams = Promise.resolve({ id: "sub1" });

beforeEach(() => {
  vi.clearAllMocks();
  mockEnforceSameOrigin.mockReturnValue(null);
});

describe("PATCH /api/submissions/[id]", () => {
  it("returns 401 when not authenticated", async () => {
    adminDenied(401);
    const req = makeReq("PATCH", { isRead: true });
    const res = await patchSingle(req, { params: singleParams });
    expect(res.status).toBe(401);
  });

  it("returns 400 for empty body", async () => {
    adminOk();
    const req = makeReq("PATCH", {});
    const res = await patchSingle(req, { params: singleParams });
    expect(res.status).toBe(400);
  });

  it("marks submission as read", async () => {
    adminOk();
    const updated = { id: "sub1", isRead: true, fullName: "Test" };
    mockPrisma.contactSubmission.update.mockResolvedValue(updated);
    const req = makeReq("PATCH", { isRead: true });
    const res = await patchSingle(req, { params: singleParams });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.isRead).toBe(true);
  });

  it("returns 404 when submission not found", async () => {
    adminOk();
    mockPrisma.contactSubmission.update.mockRejectedValue({ code: "P2025" });
    const req = makeReq("PATCH", { isRead: true });
    const res = await patchSingle(req, { params: singleParams });
    expect(res.status).toBe(404);
  });
});

describe("PATCH /api/submissions/bulk", () => {
  it("returns 401 when not authenticated", async () => {
    adminDenied(401);
    const req = makeReq("PATCH", { ids: ["s1"], isRead: true });
    const res = await patchBulk(req);
    expect(res.status).toBe(401);
  });

  it("returns 400 for empty ids array", async () => {
    adminOk();
    const req = makeReq("PATCH", { ids: [], isRead: true });
    const res = await patchBulk(req);
    expect(res.status).toBe(400);
  });

  it("bulk marks as read", async () => {
    adminOk();
    mockPrisma.contactSubmission.updateMany.mockResolvedValue({ count: 3 });
    const req = makeReq("PATCH", { ids: ["s1", "s2", "s3"], isRead: true });
    const res = await patchBulk(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.count).toBe(3);
  });
});

describe("DELETE /api/submissions/bulk", () => {
  it("returns 401 when not authenticated", async () => {
    adminDenied(401);
    const req = makeReq("DELETE", { ids: ["s1"] });
    const res = await deleteBulk(req);
    expect(res.status).toBe(401);
  });

  it("bulk deletes submissions", async () => {
    adminOk();
    mockPrisma.contactSubmission.deleteMany.mockResolvedValue({ count: 2 });
    const req = makeReq("DELETE", { ids: ["s1", "s2"] });
    const res = await deleteBulk(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.count).toBe(2);
  });

  it("returns 400 for invalid body", async () => {
    adminOk();
    const req = makeReq("DELETE", { ids: [] });
    const res = await deleteBulk(req);
    expect(res.status).toBe(400);
  });
});
