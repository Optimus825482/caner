import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import {
  enforceSameOrigin,
  getClientIp,
  buildClientKey,
  createMemoryRateLimitAdapter,
  enforceRateLimit,
  createSiteSettingRateLimitAdapter,
} from "../request-guards";

function makeReq(
  url: string,
  headers: Record<string, string> = {},
): NextRequest {
  return new NextRequest(new URL(url, "http://localhost:3018"), { headers });
}

describe("enforceSameOrigin", () => {
  it("allows request when origin matches nextUrl.origin", () => {
    const req = makeReq("/api/test", {
      origin: "http://localhost:3018",
    });
    expect(enforceSameOrigin(req)).toBeNull();
  });

  it("allows request when origin matches forwarded host", () => {
    const req = makeReq("/api/test", {
      origin: "https://arvesta.com",
      "x-forwarded-host": "arvesta.com",
      "x-forwarded-proto": "https",
    });
    expect(enforceSameOrigin(req)).toBeNull();
  });

  it("allows request when forwarded host contains default https port", () => {
    const req = makeReq("/api/test", {
      origin: "https://arvesta.com",
      "x-forwarded-host": "arvesta.com:443",
      "x-forwarded-proto": "https",
    });
    expect(enforceSameOrigin(req)).toBeNull();
  });

  it("rejects request with mismatched origin", async () => {
    const req = makeReq("/api/test", {
      origin: "https://evil.com",
      host: "arvesta.com",
    });
    const res = enforceSameOrigin(req);
    expect(res).not.toBeNull();
    expect(res!.status).toBe(403);
    const body = await res!.json();
    expect(body.error).toBe("Forbidden origin");
  });

  it("allows request with valid referer when no origin", () => {
    const req = makeReq("/api/test", {
      referer: "http://localhost:3018/admin",
    });
    expect(enforceSameOrigin(req)).toBeNull();
  });

  it("allows request with referer when forwarded host includes default port", () => {
    const req = makeReq("/api/test", {
      referer: "https://arvesta.com/admin",
      "x-forwarded-host": "arvesta.com:443",
      "x-forwarded-proto": "https",
    });
    expect(enforceSameOrigin(req)).toBeNull();
  });

  it("rejects request with no origin and no referer", async () => {
    const req = makeReq("/api/test", { host: "localhost:3018" });
    const res = enforceSameOrigin(req);
    expect(res).not.toBeNull();
    expect(res!.status).toBe(403);
  });

  it("rejects request with mismatched referer", async () => {
    const req = makeReq("/api/test", {
      referer: "https://evil.com/page",
      host: "arvesta.com",
    });
    const res = enforceSameOrigin(req);
    expect(res).not.toBeNull();
    expect(res!.status).toBe(403);
  });
});

describe("getClientIp", () => {
  it("returns cf-connecting-ip when present", () => {
    const req = makeReq("/api/test", { "cf-connecting-ip": "1.2.3.4" });
    expect(getClientIp(req)).toBe("1.2.3.4");
  });

  it("returns first x-forwarded-for IP", () => {
    const req = makeReq("/api/test", {
      "x-forwarded-for": "10.0.0.1, 10.0.0.2",
    });
    expect(getClientIp(req)).toBe("10.0.0.1");
  });

  it("returns x-real-ip as fallback", () => {
    const req = makeReq("/api/test", { "x-real-ip": "192.168.1.1" });
    expect(getClientIp(req)).toBe("192.168.1.1");
  });

  it("returns 'unknown' when no IP headers", () => {
    const req = makeReq("/api/test");
    expect(getClientIp(req)).toBe("unknown");
  });

  it("prefers cf-connecting-ip over x-forwarded-for", () => {
    const req = makeReq("/api/test", {
      "cf-connecting-ip": "1.1.1.1",
      "x-forwarded-for": "2.2.2.2",
    });
    expect(getClientIp(req)).toBe("1.1.1.1");
  });
});

describe("buildClientKey", () => {
  it("returns a string with scope prefix", () => {
    const req = makeReq("/api/test", {
      "x-forwarded-for": "1.2.3.4",
      "user-agent": "TestAgent",
      "accept-language": "en",
    });
    const key = buildClientKey(req, "test-scope");
    expect(key).toMatch(/^test-scope:/);
  });

  it("produces different keys for different scopes", () => {
    const req = makeReq("/api/test", { "x-forwarded-for": "1.2.3.4" });
    const key1 = buildClientKey(req, "scope-a");
    const key2 = buildClientKey(req, "scope-b");
    expect(key1).not.toBe(key2);
  });

  it("produces deterministic output for same inputs", () => {
    const req = makeReq("/api/test", {
      "x-forwarded-for": "1.2.3.4",
      "user-agent": "Bot",
    });
    const key1 = buildClientKey(req, "s");
    const key2 = buildClientKey(req, "s");
    expect(key1).toBe(key2);
  });
});

describe("createMemoryRateLimitAdapter", () => {
  it("returns null for unknown key", async () => {
    const adapter = createMemoryRateLimitAdapter();
    expect(await adapter.get("unknown")).toBeNull();
  });

  it("stores and retrieves state", async () => {
    const adapter = createMemoryRateLimitAdapter();
    const state = { count: 3, resetAt: Date.now() + 60000 };
    await adapter.set("key1", state);
    expect(await adapter.get("key1")).toEqual(state);
  });

  it("overwrites existing state", async () => {
    const adapter = createMemoryRateLimitAdapter();
    await adapter.set("k", { count: 1, resetAt: 100 });
    await adapter.set("k", { count: 5, resetAt: 200 });
    expect(await adapter.get("k")).toEqual({ count: 5, resetAt: 200 });
  });
});

describe("createSiteSettingRateLimitAdapter", () => {
  it("returns null when no record exists", async () => {
    const delegate = {
      findUnique: vi.fn().mockResolvedValue(null),
      upsert: vi.fn(),
    };
    const adapter = createSiteSettingRateLimitAdapter(delegate);
    expect(await adapter.get("key")).toBeNull();
  });

  it("parses stored JSON state", async () => {
    const state = { count: 2, resetAt: 999 };
    const delegate = {
      findUnique: vi.fn().mockResolvedValue({ value: JSON.stringify(state) }),
      upsert: vi.fn(),
    };
    const adapter = createSiteSettingRateLimitAdapter(delegate);
    expect(await adapter.get("key")).toEqual(state);
  });

  it("returns null for invalid JSON", async () => {
    const delegate = {
      findUnique: vi.fn().mockResolvedValue({ value: "not-json" }),
      upsert: vi.fn(),
    };
    const adapter = createSiteSettingRateLimitAdapter(delegate);
    expect(await adapter.get("key")).toBeNull();
  });

  it("calls upsert on set", async () => {
    const delegate = {
      findUnique: vi.fn(),
      upsert: vi.fn(),
    };
    const adapter = createSiteSettingRateLimitAdapter(delegate);
    await adapter.set("rl:key", { count: 1, resetAt: 500 });
    expect(delegate.upsert).toHaveBeenCalledWith({
      where: { key: "rl:key" },
      create: {
        key: "rl:key",
        value: JSON.stringify({ count: 1, resetAt: 500 }),
      },
      update: { value: JSON.stringify({ count: 1, resetAt: 500 }) },
    });
  });
});

describe("enforceRateLimit", () => {
  let adapter: ReturnType<typeof createMemoryRateLimitAdapter>;

  beforeEach(() => {
    adapter = createMemoryRateLimitAdapter();
  });

  it("allows first request and initializes counter", async () => {
    const res = await enforceRateLimit({
      adapter,
      keyPrefix: "test",
      clientKey: "client1",
      windowMs: 60000,
      maxRequests: 5,
      errorMessage: "Too many",
    });
    expect(res).toBeNull();
    const state = await adapter.get("test:client1");
    expect(state?.count).toBe(1);
  });

  it("allows requests under the limit", async () => {
    for (let i = 0; i < 4; i++) {
      const res = await enforceRateLimit({
        adapter,
        keyPrefix: "test",
        clientKey: "c",
        windowMs: 60000,
        maxRequests: 5,
        errorMessage: "Too many",
      });
      expect(res).toBeNull();
    }
  });

  it("blocks requests at the limit with 429", async () => {
    // Fill up to max
    await adapter.set("test:c", { count: 5, resetAt: Date.now() + 60000 });

    const res = await enforceRateLimit({
      adapter,
      keyPrefix: "test",
      clientKey: "c",
      windowMs: 60000,
      maxRequests: 5,
      errorMessage: "Rate limited!",
    });
    expect(res).not.toBeNull();
    expect(res!.status).toBe(429);
    const body = await res!.json();
    expect(body.error).toBe("Rate limited!");
    expect(res!.headers.get("Retry-After")).toBeTruthy();
  });

  it("resets counter after window expires", async () => {
    // Set expired window
    await adapter.set("test:c", { count: 10, resetAt: Date.now() - 1000 });

    const res = await enforceRateLimit({
      adapter,
      keyPrefix: "test",
      clientKey: "c",
      windowMs: 60000,
      maxRequests: 5,
      errorMessage: "Too many",
    });
    expect(res).toBeNull();
    const state = await adapter.get("test:c");
    expect(state?.count).toBe(1);
  });
});
