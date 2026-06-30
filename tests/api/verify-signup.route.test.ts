import { beforeEach, describe, expect, it, vi } from "vitest";

import { checkRateLimit, isJsonRequest, isTrustedOrigin } from "@/lib/security/guards";
import { verifySignupCode } from "@/lib/services/user-service";

vi.mock("@/lib/security/guards", () => ({
  checkRateLimit: vi.fn(),
  isJsonRequest: vi.fn(),
  isTrustedOrigin: vi.fn(),
}));

vi.mock("@/lib/services/user-service", () => ({
  verifySignupCode: vi.fn(),
}));

import { POST } from "@/app/api/auth/verify-signup/route";

const mockCheckRateLimit = vi.mocked(checkRateLimit);
const mockIsJsonRequest = vi.mocked(isJsonRequest);
const mockIsTrustedOrigin = vi.mocked(isTrustedOrigin);
const mockVerifySignupCode = vi.mocked(verifySignupCode);

describe("POST /api/auth/verify-signup", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCheckRateLimit.mockReturnValue({ ok: true, retryAfterSeconds: 0 });
    mockIsJsonRequest.mockReturnValue(true);
    mockIsTrustedOrigin.mockReturnValue(true);
  });

  it("verifies a valid signup code", async () => {
    mockVerifySignupCode.mockResolvedValue({
      ok: true,
      user: {
        id: "user-1",
        name: "Adeline",
        email: "adeline@example.com",
        role: "customer",
      },
    });

    const request = new Request("http://localhost:3000/api/auth/verify-signup", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "adeline@example.com", code: "123456" }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      ok: true,
      message: "Email verified. You can now log in to your account.",
    });
  });

  it("rejects an invalid or expired signup code", async () => {
    mockVerifySignupCode.mockResolvedValue({
      ok: false,
      reason: "invalid-code",
    });

    const request = new Request("http://localhost:3000/api/auth/verify-signup", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "adeline@example.com", code: "123456" }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toMatchObject({
      ok: false,
      message: "Verification code is invalid or has expired.",
    });
  });
});
