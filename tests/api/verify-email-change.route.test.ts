import { beforeEach, describe, expect, it, vi } from "vitest";

import { requireAuthenticatedUser } from "@/lib/auth/guards";
import { checkRateLimit, isJsonRequest, isTrustedOrigin } from "@/lib/security/guards";
import { verifyEmailChangeByCode, verifyEmailChangeByToken } from "@/lib/services/user-service";

vi.mock("@/lib/auth/guards", () => ({
  requireAuthenticatedUser: vi.fn(),
}));

vi.mock("@/lib/security/guards", () => ({
  checkRateLimit: vi.fn(),
  isJsonRequest: vi.fn(),
  isTrustedOrigin: vi.fn(),
}));

vi.mock("@/lib/services/user-service", () => ({
  verifyEmailChangeByCode: vi.fn(),
  verifyEmailChangeByToken: vi.fn(),
}));

import { POST } from "@/app/api/account/verify-email-change/route";

const mockRequireAuthenticatedUser = vi.mocked(requireAuthenticatedUser);
const mockCheckRateLimit = vi.mocked(checkRateLimit);
const mockIsJsonRequest = vi.mocked(isJsonRequest);
const mockIsTrustedOrigin = vi.mocked(isTrustedOrigin);
const mockVerifyEmailChangeByCode = vi.mocked(verifyEmailChangeByCode);
const mockVerifyEmailChangeByToken = vi.mocked(verifyEmailChangeByToken);

describe("POST /api/account/verify-email-change", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAuthenticatedUser.mockResolvedValue({
      user: { id: "user-1", email: "old@example.com", role: "customer" },
    } as never);
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

  it("verifies a valid email change code for the signed-in user", async () => {
    mockVerifyEmailChangeByCode.mockResolvedValue({
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
      body: JSON.stringify({ code: "123456" }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      ok: true,
      message: "Email verified successfully. Sign out and back in to refresh your session email.",
    });
    expect(mockVerifyEmailChangeByCode).toHaveBeenCalledWith({
      userId: "user-1",
      code: "123456",
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
      message: "Verification code or link is invalid or has expired.",
    });
  });

  it("returns 401 when a code is submitted without an authenticated session", async () => {
    mockRequireAuthenticatedUser.mockResolvedValue(null);

    const request = new Request("http://localhost:3000/api/account/verify-email-change", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ code: "123456" }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body).toMatchObject({
      ok: false,
      message: "Unauthorized",
    });
  });
});
