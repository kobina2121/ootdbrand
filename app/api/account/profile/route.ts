import { NextResponse } from "next/server";
import { z } from "zod";

import { failure, success } from "@/lib/api-response";
import { requireAuthenticatedUser } from "@/lib/auth/guards";
import { isSmtpConfigured, sendEmailChangeVerificationEmail } from "@/lib/email/smtp";
import { checkRateLimit, isJsonRequest, isTrustedOrigin } from "@/lib/security/guards";
import { updateProfileForUser } from "@/lib/services/user-service";

const updateProfileSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters."),
  email: z.string().trim().email("Enter a valid email address."),
  currentPassword: z.string().trim().optional(),
});

export async function PATCH(request: Request) {
  if (!isTrustedOrigin(request)) {
    return NextResponse.json(failure("Invalid request origin."), { status: 403 });
  }

  if (!isJsonRequest(request)) {
    return NextResponse.json(failure("Unsupported content type."), { status: 415 });
  }

  const rateLimit = checkRateLimit(request, {
    bucket: "account:update-profile",
    limit: 12,
    windowMs: 15 * 60 * 1000,
  });
  if (!rateLimit.ok) {
    return NextResponse.json(failure("Too many profile updates. Please try again shortly."), {
      status: 429,
      headers: { "Retry-After": String(rateLimit.retryAfterSeconds) },
    });
  }

  const session = await requireAuthenticatedUser();

  if (!session?.user) {
    return NextResponse.json(failure("Unauthorized"), { status: 401 });
  }

  try {
    const json = await request.json();
    const parsed = updateProfileSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(failure("Invalid account details."), { status: 400 });
    }

    const requestedEmail = parsed.data.email.toLowerCase();
    const currentEmail = session.user.email?.trim().toLowerCase();

    if (currentEmail && requestedEmail !== currentEmail && !isSmtpConfigured()) {
      return NextResponse.json(
        failure("Email verification is not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, and EMAIL_FROM."),
        { status: 500 },
      );
    }

    const result = await updateProfileForUser({
      userId: session.user.id,
      name: parsed.data.name,
      email: requestedEmail,
      currentPassword: parsed.data.currentPassword,
    });

    if (!result.ok) {
      if (result.reason === "duplicate-email") {
        return NextResponse.json(failure("That email is already in use."), { status: 409 });
      }

      if (result.reason === "invalid-current-password") {
        return NextResponse.json(failure("Current password is required to change your email address."), { status: 400 });
      }

      if (result.reason === "password-not-set") {
        return NextResponse.json(
          failure("This account does not have a password set yet. Set a password before changing your email."),
          { status: 400 },
        );
      }

      return NextResponse.json(failure("User account not found."), { status: 404 });
    }

    const currentEmailForVerification = currentEmail ?? result.user.email;

    if (result.verificationCode && result.pendingEmail && currentEmailForVerification) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || "http://localhost:3000";
      const verifyUrl =
        result.verificationToken ? `${appUrl}/verify-email-change?token=${result.verificationToken}` : undefined;

      try {
        await sendEmailChangeVerificationEmail({
          to: result.pendingEmail,
          verificationCode: result.verificationCode,
          verifyUrl,
          brandName: "theootd.brand",
          currentEmail: currentEmailForVerification,
        });
      } catch (error) {
        console.error("[account.profile] Failed to send email verification", error);
        return NextResponse.json(failure("Could not send email verification. Please try again."), { status: 502 });
      }
    }

    return NextResponse.json(
      success(result.pendingEmail ? "Profile updated. Verify your new email to finish the change." : "Profile updated successfully.", {
        user: result.user,
        emailChanged: result.emailChanged,
        pendingEmail: result.pendingEmail,
      }),
    );
  } catch {
    return NextResponse.json(failure("Could not update profile."), { status: 500 });
  }
}
