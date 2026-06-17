type RateLimitOptions = {
  bucket: string;
  limit: number;
  windowMs: number;
};

type RateLimitStoreEntry = {
  count: number;
  resetAt: number;
};

type RateLimitCheck =
  | { ok: true }
  | {
      ok: false;
      retryAfterSeconds: number;
    };

const RATE_LIMIT_STORE_KEY = "__tide_rate_limit_store__";

function getStore() {
  const globalScope = globalThis as typeof globalThis & {
    [RATE_LIMIT_STORE_KEY]?: Map<string, RateLimitStoreEntry>;
  };

  if (!globalScope[RATE_LIMIT_STORE_KEY]) {
    globalScope[RATE_LIMIT_STORE_KEY] = new Map<string, RateLimitStoreEntry>();
  }

  return globalScope[RATE_LIMIT_STORE_KEY];
}

function getClientIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) {
      return first;
    }
  }

  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

export function checkRateLimit(request: Request, options: RateLimitOptions): RateLimitCheck {
  const now = Date.now();
  const store = getStore();
  const ip = getClientIp(request);
  const key = `${options.bucket}:${ip}`;
  const existing = store.get(key);

  if (!existing || existing.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + options.windowMs });
    return { ok: true };
  }

  if (existing.count >= options.limit) {
    return {
      ok: false,
      retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
    };
  }

  existing.count += 1;
  store.set(key, existing);
  return { ok: true };
}

export function isTrustedOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) {
    return true;
  }

  let expectedOrigin = "";
  try {
    const requestUrl = new URL(request.url);
    const host = request.headers.get("x-forwarded-host") || request.headers.get("host") || requestUrl.host;
    const proto = request.headers.get("x-forwarded-proto") || requestUrl.protocol.replace(":", "");
    expectedOrigin = `${proto}://${host}`.toLowerCase();
  } catch {
    return false;
  }

  return origin.toLowerCase() === expectedOrigin;
}

export function isJsonRequest(request: Request) {
  const contentType = request.headers.get("content-type") || "";
  return contentType.toLowerCase().includes("application/json");
}
