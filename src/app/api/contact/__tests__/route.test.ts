import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const {
  mockEnforceSameOrigin,
  mockBuildClientKey,
  mockEnforceRateLimit,
  mockGetClientIp,
  mockCreateMemoryAdapter,
  mockPrisma,
  mockSendNotification,
} = vi.hoisted(() => ({
  mockEnforceSameOrigin: vi.fn().mockReturnValue(null),
  mockBuildClientKey: vi.fn().mockReturnValue("client:key"),
  mockEnforceRateLimit: vi.fn().mockResolvedValue(null),
  mockGetClientIp: vi.fn().mockReturnValue("1.2.3.4"),
  mockCreateMemoryAdapter: vi.fn().mockReturnValue({}),
  mockPrisma: {
    contactSubmission: { create: vi.fn() },
  },
  mockSendNotification: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/request-guards", () => ({
  enforceSameOrigin: (req: NextRequest) => mockEnforceSameOrigin(req),
  buildClientKey: (...a: unknown[]) => mockBuildClientKey(...a),
  enforceRateLimit: (...a: unknown[]) => mockEnforceRateLimit(...a),
  getClientIp: (...a: unknown[]) => mockGetClientIp(...a),
  createMemoryRateLimitAdapter: () => mockCreateMemoryAdapter(),
}));
vi.mock("@/lib/prisma", () => ({ prisma: mockPrisma }));
vi.mock("@/lib/mailer", () => ({
  sendContactSubmissionNotification: (...a: unknown[]) =>
    mockSendNotification(...a),
}));

import { POST } from "../route";

function makeReq(body?: unknown): NextRequest {
  const init = {
    method: "POST" as const,
    headers: {
      "content-type": "application/json",
      origin: "http://localhost:3018",
    },
    body: body ? JSON.stringify(body) : undefined,
  };
  return new NextRequest(
    new URL("/api/contact", "http://localhost:3018"),
    init,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mockEnforceSameOrigin.mockReturnValue(null);
  mockEnforceRateLimit.mockResolvedValue(null);
  delete process.env.TURNSTILE_SECRET_KEY;
});

const validContact = {
  fullName: "Jean Dupont",
  email: "jean@example.com",
  projectType: "Kitchen renovation",
  description:
    "I need a modern kitchen with marble countertops and custom cabinets.",
};

describe("POST /api/contact", () => {
  it("returns 403 when origin denied", async () => {
    mockEnforceSameOrigin.mockReturnValue(
      Response.json({ error: "Forbidden" }, { status: 403 }),
    );
    const req = makeReq(validContact);
    const res = await POST(req);
    expect(res.status).toBe(403);
  });

  it("returns 400 for missing required fields", async () => {
    const req = makeReq({ fullName: "Test" });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 400 for description too short", async () => {
    const req = makeReq({ ...validContact, description: "short" });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 400 for invalid email", async () => {
    const req = makeReq({ ...validContact, email: "not-an-email" });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 400 when honeypot is filled (spam)", async () => {
    const req = makeReq({ ...validContact, honeypot: "bot-filled" });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("creates submission with valid data", async () => {
    const created = { id: "sub1", ...validContact };
    mockPrisma.contactSubmission.create.mockResolvedValue(created);
    const req = makeReq(validContact);
    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.id).toBe("sub1");
  });

  it("returns 429 when rate limited", async () => {
    mockEnforceRateLimit.mockResolvedValue(
      Response.json({ error: "Too many" }, { status: 429 }),
    );
    const req = makeReq(validContact);
    const res = await POST(req);
    expect(res.status).toBe(429);
  });

  it("succeeds even if email notification fails", async () => {
    mockSendNotification.mockRejectedValue(new Error("SMTP error"));
    const created = { id: "sub2", ...validContact };
    mockPrisma.contactSubmission.create.mockResolvedValue(created);
    const req = makeReq(validContact);
    const res = await POST(req);
    expect(res.status).toBe(200);
  });
});
