import { describe, expect, it } from "vitest";

import { checkRateLimitForKey } from "@/lib/security/guards";

describe("checkRateLimitForKey", () => {
  it("blocks requests after the configured limit", () => {
    const bucket = `test:rate-limit:${crypto.randomUUID()}`;
    const options = {
      bucket,
      limit: 2,
      windowMs: 60_000,
    };

    expect(checkRateLimitForKey("client-1", options)).toEqual({ ok: true });
    expect(checkRateLimitForKey("client-1", options)).toEqual({ ok: true });
    expect(checkRateLimitForKey("client-1", options)).toMatchObject({
      ok: false,
      retryAfterSeconds: expect.any(Number),
    });
    expect(checkRateLimitForKey("client-2", options)).toEqual({ ok: true });
  });
});
