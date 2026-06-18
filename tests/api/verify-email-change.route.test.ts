import { beforeEach, describe, expect, it, vi } from "vitest";

import { checkRateLimit, isJsonRequest, isTrustedOrigin } from "@/lib/security/guards";
import { verifyEmailChangeByToken } from "@/lib/services/user-service";

vi.mock("@/lib/security/guards", () => ({
  checkRateLimit: vi.fn(),
  isJsonRequest: vi.fn(),
  isTrustedOrigin: vi.fn(),
}));

vi.mock("@/lib/services/user-service", () => ({
  verifyEmailChangeByToken: vi.fn(),
}));

import { POST } from "@/app/api/account/verify-email-change/route";

const mockCheckRateLimit = vi.mocked(checkRateLimit);
const mockIsJsonRequest = vi.mocked(isJsonRequest);
const mockIsTrustedOrigin = vi.mocked(isTrustedOrigin);
const mockVerifyEmailChangeByToken = vi.mocked(verifyEmailChangeByToken);

describe("POST /api/account/verify-email-change", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCheckRateLimit.mockReturnValue({ ok: true, retryAfterSeconds: 0 });
    mockIsJsonRequest.mockReturnValue(true);
    mockIsTrustedOrigin.mockReturnValue(true);
  });

  it("verifies a valid email change token", async () => {
    mockVerifyEmailChangeByToken.mockResolvedValue({
      ok: true,
      user: {
        id: "user-1",
        name: "Adeline",
        email: "new@example.com",
        role: "customer",
      },
    });

    const request = new Request("http://localhost:3000/api/account/verify-email-change", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ token: "12345678901234567890123456789012" }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      ok: true,
      message: "Email verified successfully. Sign out and back in to refresh your session email.",
    });
  });

  it("rejects an invalid or expired token", async () => {
    mockVerifyEmailChangeByToken.mockResolvedValue({
      ok: false,
      reason: "invalid-token",
    });

    const request = new Request("http://localhost:3000/api/account/verify-email-change", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ token: "12345678901234567890123456789012" }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toMatchObject({
      ok: false,
      message: "Verification link is invalid or has expired.",
    });
  });
});
