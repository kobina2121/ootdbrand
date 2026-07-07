import { NextResponse } from "next/server";
import { z } from "zod";

import { failure, success } from "@/lib/api-response";
import { requireAuthenticatedUser } from "@/lib/auth/guards";
import { isSmtpConfigured, sendResetPasswordEmail } from "@/lib/email/smtp";
import { checkRateLimit, isJsonRequest, isTrustedOrigin } from "@/lib/security/guards";
import { requestPasswordReset } from "@/lib/services/user-service";

const forgotPasswordSchema = z.object({
  email: z.string().trim().email("Enter a valid email address").optional(),
});

export async function POST(request: Request) {
  try {
    if (!isTrustedOrigin(request)) {
      return NextResponse.json(failure("Invalid request origin."), { status: 403 });
    }

    if (!isJsonRequest(request)) {
      return NextResponse.json(failure("Unsupported content type."), { status: 415 });
    }

    const rateLimit = checkRateLimit(request, {
      bucket: "auth:forgot-password",
      limit: 5,
      windowMs: 15 * 60 * 1000,
    });
    if (!rateLimit.ok) {
      return NextResponse.json(failure("Too many reset attempts. Try again shortly."), {
        status: 429,
        headers: { "Retry-After": String(rateLimit.retryAfterSeconds) },
      });
    }

    if (!isSmtpConfigured()) {
      return NextResponse.json(
        failure("Email service is not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, and EMAIL_FROM."),
        { status: 500 },
      );
    }

    const json = await request.json();
    const parsed = forgotPasswordSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(failure("Invalid request"), { status: 400 });
    }

    const session = await requireAuthenticatedUser();
    const requestedEmail = parsed.data.email?.trim().toLowerCase();
    const authenticatedEmail = session?.user?.email?.trim().toLowerCase();

    if (authenticatedEmail && requestedEmail && requestedEmail !== authenticatedEmail) {
      return NextResponse.json(failure("Signed-in users can only reset the password for their own account."), {
        status: 403,
      });
    }

    const effectiveEmail = authenticatedEmail ?? requestedEmail;

    if (!effectiveEmail) {
      return NextResponse.json(failure("Email is required."), { status: 400 });
    }

    const result = await requestPasswordReset(effectiveEmail);
    if (result.requested) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || "http://localhost:3000";
      const resetUrl = `${appUrl}/reset-password?token=${result.token}`;
      try {
        await sendResetPasswordEmail({
          to: effectiveEmail,
          resetUrl,
          brandName: "theootd.brand",
        });
      } catch (error) {
        console.error("[auth.forgot-password] Failed to send reset email", error);
        return NextResponse.json(failure("Could not send password reset email. Please try again."), { status: 502 });
      }
    }

    return NextResponse.json(success("If an account exists for this email, a reset link has been sent.", {}));
  } catch {
    return NextResponse.json(failure("Could not process password reset"), { status: 500 });
  }
}
