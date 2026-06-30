import { beforeEach, describe, expect, it, vi } from "vitest";

import { isSmtpConfigured, sendSignupVerificationEmail } from "@/lib/email/smtp";
import { checkRateLimit, isJsonRequest, isTrustedOrigin } from "@/lib/security/guards";
import { createCustomerUser, DuplicateUserError } from "@/lib/services/user-service";

vi.mock("@/lib/email/smtp", () => ({
  isSmtpConfigured: vi.fn(),
  sendSignupVerificationEmail: vi.fn(),
}));

vi.mock("@/lib/security/guards", () => ({
  checkRateLimit: vi.fn(),
  isJsonRequest: vi.fn(),
  isTrustedOrigin: vi.fn(),
}));

vi.mock("@/lib/services/user-service", () => ({
  createCustomerUser: vi.fn(),
  DuplicateUserError: class DuplicateUserError extends Error {
    constructor(message = "A user with this email already exists.") {
      super(message);
      this.name = "DuplicateUserError";
    }
  },
}));

import { POST } from "@/app/api/auth/signup/route";

const mockIsSmtpConfigured = vi.mocked(isSmtpConfigured);
const mockSendSignupVerificationEmail = vi.mocked(sendSignupVerificationEmail);
const mockCheckRateLimit = vi.mocked(checkRateLimit);
const mockIsJsonRequest = vi.mocked(isJsonRequest);
const mockIsTrustedOrigin = vi.mocked(isTrustedOrigin);
const mockCreateCustomerUser = vi.mocked(createCustomerUser);

describe("POST /api/auth/signup", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsSmtpConfigured.mockReturnValue(true);
    mockCheckRateLimit.mockReturnValue({ ok: true, retryAfterSeconds: 0 });
    mockIsJsonRequest.mockReturnValue(true);
    mockIsTrustedOrigin.mockReturnValue(true);
  });

  it("creates an account and sends a signup verification code", async () => {
    mockCreateCustomerUser.mockResolvedValue({
      user: {
        id: "user-1",
        name: "Adeline",
        email: "adeline@example.com",
        role: "customer",
      },
      verificationCode: "123456",
      alreadyPending: false,
    });

    const request = new Request("http://localhost:3000/api/auth/signup", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "Adeline",
        email: "adeline@example.com",
        password: "CorrectPass123",
      }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body).toMatchObject({
      ok: true,
      message: "Account created. Enter the verification code sent to your email.",
      data: {
        email: "adeline@example.com",
      },
    });
    expect(mockSendSignupVerificationEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "adeline@example.com",
        verificationCode: "123456",
      }),
    );
  });

  it("returns 500 when signup email verification is not configured", async () => {
    mockIsSmtpConfigured.mockReturnValue(false);

    const request = new Request("http://localhost:3000/api/auth/signup", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "Adeline",
        email: "adeline@example.com",
        password: "CorrectPass123",
      }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toMatchObject({
      ok: false,
      message: "Signup verification is not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, and EMAIL_FROM.",
    });
    expect(mockCreateCustomerUser).not.toHaveBeenCalled();
  });

  it("returns 409 when the email already exists", async () => {
    mockCreateCustomerUser.mockRejectedValue(new DuplicateUserError());

    const request = new Request("http://localhost:3000/api/auth/signup", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "Adeline",
        email: "adeline@example.com",
        password: "CorrectPass123",
      }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(409);
    expect(body).toMatchObject({
      ok: false,
      message: "A user with this email already exists.",
    });
  });
});
