import { createHash } from "crypto";
import { NextRequest, NextResponse } from "next/server";

type RateLimitState = {
  count: number;
  resetAt: number;
};

export type RateLimitAdapter = {
  get: (key: string) => Promise<RateLimitState | null>;
  set: (key: string, state: RateLimitState) => Promise<void>;
};

type CachedRateLimitState = {
  state: RateLimitState;
  expiresAt: number;
};

export function enforceSameOrigin(req: NextRequest): NextResponse | null {
  const origin = req.headers.get("origin");
  const referer = req.headers.get("referer");

  // Build the expected origin from the request URL.
  // Behind a reverse proxy (Coolify / Docker) the forwarded host + proto
  // reflect the real public origin, while nextUrl.origin may be localhost.
  const forwardedHost =
    req.headers.get("x-forwarded-host") || req.headers.get("host");
  const forwardedProto = req.headers.get("x-forwarded-proto") || "https";
  const expectedOrigin = forwardedHost
    ? `${forwardedProto}://${forwardedHost.split(",")[0].trim()}`
    : req.nextUrl.origin;

  if (origin) {
    if (origin !== expectedOrigin && origin !== req.nextUrl.origin) {
      return NextResponse.json({ error: "Forbidden origin" }, { status: 403 });
    }
    return null;
  }

  if (
    !referer ||
    (!referer.startsWith(expectedOrigin) &&
      !referer.startsWith(req.nextUrl.origin))
  ) {
    return NextResponse.json(
      { error: "Origin or referer header is required" },
      { status: 403 },
    );
  }

  return null;
}

export function getClientIp(req: NextRequest): string {
  const cfConnectingIp = req.headers.get("cf-connecting-ip")?.trim();
  if (cfConnectingIp) return cfConnectingIp;

  const xForwardedFor = req.headers.get("x-forwarded-for");
  if (xForwardedFor) {
    const first = xForwardedFor.split(",")[0]?.trim();
    if (first) return first;
  }

  const xRealIp = req.headers.get("x-real-ip")?.trim();
  if (xRealIp) return xRealIp;

  return "unknown";
}

export function buildClientKey(req: NextRequest, scope: string): string {
  const ip = getClientIp(req);
  const userAgent = req.headers.get("user-agent")?.trim() || "unknown";
  const acceptLanguage =
    req.headers.get("accept-language")?.trim() || "unknown";

  const digest = createHash("sha256")
    .update(`${scope}|${ip}|${userAgent}|${acceptLanguage}`)
    .digest("base64url");

  return `${scope}:${digest}`;
}

function parseRateLimitState(value: string): RateLimitState | null {
  try {
    const parsed = JSON.parse(value) as { count?: unknown; resetAt?: unknown };
    if (
      typeof parsed.count !== "number" ||
      !Number.isFinite(parsed.count) ||
      parsed.count < 0 ||
      typeof parsed.resetAt !== "number" ||
      !Number.isFinite(parsed.resetAt)
    ) {
      return null;
    }

    return {
      count: Math.floor(parsed.count),
      resetAt: Math.floor(parsed.resetAt),
    };
  } catch {
    return null;
  }
}

export function createMemoryRateLimitAdapter(): RateLimitAdapter {
  const store = new Map<string, RateLimitState>();

  return {
    async get(key: string) {
      return store.get(key) ?? null;
    },
    async set(key: string, state: RateLimitState) {
      store.set(key, state);
    },
  };
}

function touchCacheEntry<K, V>(map: Map<K, V>, key: K, value: V) {
  map.delete(key);
  map.set(key, value);
}

function pruneLruCache<K, V>(map: Map<K, V>, maxEntries: number) {
  while (map.size > maxEntries) {
    const oldestKey = map.keys().next().value;
    if (oldestKey === undefined) break;
    map.delete(oldestKey);
  }
}

function resolveCacheExpiry(state: RateLimitState, fallbackTtlMs: number) {
  const now = Date.now();
  return state.resetAt > now ? state.resetAt : now + fallbackTtlMs;
}

function createLruRateLimitAdapter(
  adapter: RateLimitAdapter,
  {
    maxEntries = 2000,
    fallbackTtlMs = 60_000,
  }: { maxEntries?: number; fallbackTtlMs?: number } = {},
): RateLimitAdapter {
  const cache = new Map<string, CachedRateLimitState>();

  return {
    async get(key: string) {
      const now = Date.now();
      const cached = cache.get(key);

      if (cached) {
        if (cached.expiresAt > now) {
          touchCacheEntry(cache, key, cached);
          return cached.state;
        }

        cache.delete(key);
      }

      const state = await adapter.get(key);
      if (state) {
        touchCacheEntry(cache, key, {
          state,
          expiresAt: resolveCacheExpiry(state, fallbackTtlMs),
        });
        pruneLruCache(cache, maxEntries);
      }

      return state;
    },

    async set(key: string, state: RateLimitState) {
      touchCacheEntry(cache, key, {
        state,
        expiresAt: resolveCacheExpiry(state, fallbackTtlMs),
      });
      pruneLruCache(cache, maxEntries);
      await adapter.set(key, state);
    },
  };
}

type SiteSettingDelegate = {
  findUnique: (args: {
    where: { key: string };
  }) => Promise<{ value: string } | null>;
  upsert: (args: {
    where: { key: string };
    create: { key: string; value: string };
    update: { value: string };
  }) => Promise<unknown>;
};

export function createSiteSettingRateLimitAdapter(
  siteSetting: SiteSettingDelegate,
): RateLimitAdapter {
  const dbAdapter: RateLimitAdapter = {
    async get(key: string) {
      const existing = await siteSetting.findUnique({ where: { key } });
      if (!existing) return null;
      return parseRateLimitState(existing.value);
    },
    async set(key: string, state: RateLimitState) {
      await siteSetting.upsert({
        where: { key },
        create: { key, value: JSON.stringify(state) },
        update: { value: JSON.stringify(state) },
      });
    },
  };

  return createLruRateLimitAdapter(dbAdapter);
}

export async function enforceRateLimit({
  adapter,
  keyPrefix,
  clientKey,
  windowMs,
  maxRequests,
  errorMessage,
}: {
  adapter: RateLimitAdapter;
  keyPrefix: string;
  clientKey: string;
  windowMs: number;
  maxRequests: number;
  errorMessage: string;
}): Promise<NextResponse | null> {
  const now = Date.now();
  const storageKey = `${keyPrefix}:${clientKey}`;

  const existing = await adapter.get(storageKey);

  if (!existing || now > existing.resetAt) {
    await adapter.set(storageKey, {
      count: 1,
      resetAt: now + windowMs,
    });
    return null;
  }

  if (existing.count >= maxRequests) {
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((existing.resetAt - now) / 1000),
    );

    return NextResponse.json(
      {
        error: errorMessage,
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(retryAfterSeconds),
        },
      },
    );
  }

  await adapter.set(storageKey, {
    count: existing.count + 1,
    resetAt: existing.resetAt,
  });

  return null;
}
