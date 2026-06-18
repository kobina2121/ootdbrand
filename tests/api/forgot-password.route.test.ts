import { beforeEach, describe, expect, it, vi } from "vitest";

import { requireAuthenticatedUser } from "@/lib/auth/guards";
import { isSmtpConfigured, sendResetPasswordEmail } from "@/lib/email/smtp";
import { checkRateLimit, isJsonRequest, isTrustedOrigin } from "@/lib/security/guards";
import { requestPasswordReset } from "@/lib/services/user-service";

vi.mock("@/lib/auth/guards", () => ({
  requireAuthenticatedUser: vi.fn(),
}));

vi.mock("@/lib/email/smtp", () => ({
  isSmtpConfigured: vi.fn(),
  sendResetPasswordEmail: vi.fn(),
}));

vi.mock("@/lib/security/guards", () => ({
  checkRateLimit: vi.fn(),
  isJsonRequest: vi.fn(),
  isTrustedOrigin: vi.fn(),
}));

vi.mock("@/lib/services/user-service", () => ({
  requestPasswordReset: vi.fn(),
}));

import { POST } from "@/app/api/auth/forgot-password/route";

const mockRequireAuthenticatedUser = vi.mocked(requireAuthenticatedUser);
const mockIsSmtpConfigured = vi.mocked(isSmtpConfigured);
const mockSendResetPasswordEmail = vi.mocked(sendResetPasswordEmail);
const mockCheckRateLimit = vi.mocked(checkRateLimit);
const mockIsJsonRequest = vi.mocked(isJsonRequest);
const mockIsTrustedOrigin = vi.mocked(isTrustedOrigin);
const mockRequestPasswordReset = vi.mocked(requestPasswordReset);

describe("POST /api/auth/forgot-password", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAuthenticatedUser.mockResolvedValue(null);
    mockIsSmtpConfigured.mockReturnValue(true);
    mockCheckRateLimit.mockReturnValue({ ok: true, retryAfterSeconds: 0 });
    mockIsJsonRequest.mockReturnValue(true);
    mockIsTrustedOrigin.mockReturnValue(true);
    mockRequestPasswordReset.mockResolvedValue({ requested: true, token: "12345678901234567890123456789012" });
  });

  it("uses the authenticated session email for signed-in users", async () => {
    mockRequireAuthenticatedUser.mockResolvedValue({
      user: { id: "user-1", email: "owner@example.com", role: "customer" },
    } as never);

    const request = new Request("http://localhost:3000/api/auth/forgot-password", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "owner@example.com" }),
    });

    const response = await POST(request);

    expect(response.status).toBe(200);
    expect(mockRequestPasswordReset).toHaveBeenCalledWith("owner@example.com");
    expect(mockSendResetPasswordEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "owner@example.com",
      }),
    );
  });

  it("rejects a different email for signed-in users", async () => {
    mockRequireAuthenticatedUser.mockResolvedValue({
      user: { id: "user-1", email: "owner@example.com", role: "customer" },
    } as never);

    const request = new Request("http://localhost:3000/api/auth/forgot-password", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "other@example.com" }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body).toMatchObject({
      ok: false,
      message: "Signed-in users can only reset the password for their own account.",
    });
    expect(mockRequestPasswordReset).not.toHaveBeenCalled();
  });
});
