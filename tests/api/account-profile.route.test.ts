import { beforeEach, describe, expect, it, vi } from "vitest";

import { requireAuthenticatedUser } from "@/lib/auth/guards";
import { isSmtpConfigured, sendEmailChangeVerificationEmail } from "@/lib/email/smtp";
import { checkRateLimit, isJsonRequest, isTrustedOrigin } from "@/lib/security/guards";
import { updateProfileForUser } from "@/lib/services/user-service";

vi.mock("@/lib/auth/guards", () => ({
  requireAuthenticatedUser: vi.fn(),
}));

vi.mock("@/lib/security/guards", () => ({
  checkRateLimit: vi.fn(),
  isJsonRequest: vi.fn(),
  isTrustedOrigin: vi.fn(),
}));

vi.mock("@/lib/email/smtp", () => ({
  isSmtpConfigured: vi.fn(),
  sendEmailChangeVerificationEmail: vi.fn(),
}));

vi.mock("@/lib/services/user-service", () => ({
  updateProfileForUser: vi.fn(),
}));

import { PATCH } from "@/app/api/account/profile/route";

const mockRequireAuthenticatedUser = vi.mocked(requireAuthenticatedUser);
const mockCheckRateLimit = vi.mocked(checkRateLimit);
const mockIsJsonRequest = vi.mocked(isJsonRequest);
const mockIsTrustedOrigin = vi.mocked(isTrustedOrigin);
const mockIsSmtpConfigured = vi.mocked(isSmtpConfigured);
const mockSendEmailChangeVerificationEmail = vi.mocked(sendEmailChangeVerificationEmail);
const mockUpdateProfileForUser = vi.mocked(updateProfileForUser);

describe("PATCH /api/account/profile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsTrustedOrigin.mockReturnValue(true);
    mockIsJsonRequest.mockReturnValue(true);
    mockCheckRateLimit.mockReturnValue({ ok: true, retryAfterSeconds: 0 });
    mockIsSmtpConfigured.mockReturnValue(true);
  });

  it("updates the authenticated user profile when the email is unchanged", async () => {
    mockRequireAuthenticatedUser.mockResolvedValue({
      user: { id: "user-1", email: "old@example.com", role: "customer" },
    } as never);
    mockUpdateProfileForUser.mockResolvedValue({
      ok: true,
      emailChanged: false,
      user: {
        id: "user-1",
        name: "Adeline",
        email: "old@example.com",
        role: "customer",
      },
    });

    const request = new Request("http://localhost:3000/api/account/profile", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: "Adeline", email: "old@example.com" }),
    });

    const response = await PATCH(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      ok: true,
      message: "Profile updated successfully.",
      data: {
        emailChanged: false,
        user: {
          name: "Adeline",
          email: "old@example.com",
        },
      },
    });
    expect(mockUpdateProfileForUser).toHaveBeenCalledWith({
      userId: "user-1",
      name: "Adeline",
      email: "old@example.com",
      currentPassword: undefined,
    });
    expect(mockSendEmailChangeVerificationEmail).not.toHaveBeenCalled();
  });

  it("returns 401 when the user is not authenticated", async () => {
    mockRequireAuthenticatedUser.mockResolvedValue(null);

    const request = new Request("http://localhost:3000/api/account/profile", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: "Adeline", email: "new@example.com" }),
    });

    const response = await PATCH(request);
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body).toMatchObject({
      ok: false,
      message: "Unauthorized",
    });
    expect(mockUpdateProfileForUser).not.toHaveBeenCalled();
  });

  it("returns 400 for invalid account details", async () => {
    mockRequireAuthenticatedUser.mockResolvedValue({
      user: { id: "user-1", email: "old@example.com", role: "customer" },
    } as never);

    const request = new Request("http://localhost:3000/api/account/profile", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: "A", email: "not-an-email" }),
    });

    const response = await PATCH(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toMatchObject({
      ok: false,
      message: "Invalid account details.",
    });
    expect(mockUpdateProfileForUser).not.toHaveBeenCalled();
  });

  it("returns 409 when the email address is already in use", async () => {
    mockRequireAuthenticatedUser.mockResolvedValue({
      user: { id: "user-1", email: "old@example.com", role: "customer" },
    } as never);
    mockUpdateProfileForUser.mockResolvedValue({
      ok: false,
      reason: "duplicate-email",
    });

    const request = new Request("http://localhost:3000/api/account/profile", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: "Adeline", email: "taken@example.com" }),
    });

    const response = await PATCH(request);
    const body = await response.json();

    expect(response.status).toBe(409);
    expect(body).toMatchObject({
      ok: false,
      message: "That email is already in use.",
    });
  });

  it("requires the current password before changing email", async () => {
    mockRequireAuthenticatedUser.mockResolvedValue({
      user: { id: "user-1", email: "old@example.com", role: "customer" },
    } as never);
    mockUpdateProfileForUser.mockResolvedValue({
      ok: false,
      reason: "invalid-current-password",
    });

    const request = new Request("http://localhost:3000/api/account/profile", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: "Adeline", email: "new@example.com" }),
    });

    const response = await PATCH(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toMatchObject({
      ok: false,
      message: "Current password is required to change your email address.",
    });
  });

  it("sends a verification email when changing the email address", async () => {
    mockRequireAuthenticatedUser.mockResolvedValue({
      user: { id: "user-1", email: "old@example.com", role: "customer" },
    } as never);
    mockUpdateProfileForUser.mockResolvedValue({
      ok: true,
      emailChanged: false,
      pendingEmail: "new@example.com",
      verificationCode: "123456",
      verificationToken: "12345678901234567890123456789012",
      user: {
        id: "user-1",
        name: "Adeline",
        email: "old@example.com",
        role: "customer",
      },
    });

    const request = new Request("http://localhost:3000/api/account/profile", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "Adeline",
        email: "new@example.com",
        currentPassword: "CorrectPass123",
      }),
    });

    const response = await PATCH(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      ok: true,
      message: "Profile updated. Verify your new email to finish the change.",
      data: {
        pendingEmail: "new@example.com",
      },
    });
    expect(mockSendEmailChangeVerificationEmail).toHaveBeenCalledWith({
      to: "new@example.com",
      verificationCode: "123456",
      verifyUrl: expect.stringContaining("/verify-email-change?token=12345678901234567890123456789012"),
      brandName: "Tide",
      currentEmail: "old@example.com",
    });
  });
});
