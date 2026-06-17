import { NextResponse } from "next/server";
import { z } from "zod";

import { failure, success } from "@/lib/api-response";
import { isSmtpConfigured, sendResetPasswordEmail } from "@/lib/email/smtp";
import { checkRateLimit, isJsonRequest, isTrustedOrigin } from "@/lib/security/guards";
import { requestPasswordReset } from "@/lib/services/user-service";

const forgotPasswordSchema = z.object({
  email: z.string().email("Enter a valid email address"),
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

    const result = await requestPasswordReset(parsed.data.email);
    if (result.requested) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || "http://localhost:3000";
      const resetUrl = `${appUrl}/reset-password?token=${result.token}`;
      try {
        await sendResetPasswordEmail({
          to: parsed.data.email,
          resetUrl,
          brandName: "Tide",
        });
      } catch {
        return NextResponse.json(failure("Could not send password reset email. Please try again."), { status: 502 });
      }
    }

    return NextResponse.json(success("If an account exists for this email, a reset link has been sent.", {}));
  } catch {
    return NextResponse.json(failure("Could not process password reset"), { status: 500 });
  }
}
