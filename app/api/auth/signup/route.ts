import { NextResponse } from "next/server";
import { z } from "zod";

import { failure, success } from "@/lib/api-response";
import { isSmtpConfigured, sendSignupVerificationEmail } from "@/lib/email/smtp";
import { checkRateLimit, isJsonRequest, isTrustedOrigin } from "@/lib/security/guards";
import { createCustomerUser, DuplicateUserError } from "@/lib/services/user-service";

const signupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Enter a valid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Za-z]/, "Password must include letters")
    .regex(/[0-9]/, "Password must include numbers"),
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
      bucket: "auth:signup",
      limit: 6,
      windowMs: 15 * 60 * 1000,
    });
    if (!rateLimit.ok) {
      return NextResponse.json(failure("Too many signup attempts. Please wait and try again."), {
        status: 429,
        headers: { "Retry-After": String(rateLimit.retryAfterSeconds) },
      });
    }

    const json = await request.json();
    const parsed = signupSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(failure("Invalid signup details"), { status: 400 });
    }

    if (!isSmtpConfigured()) {
      return NextResponse.json(
        failure("Signup verification is not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, and EMAIL_FROM."),
        { status: 500 },
      );
    }

    const result = await createCustomerUser(parsed.data);

    try {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || "http://localhost:3000";
      const verifyUrl = `${appUrl}/verify-signup?email=${encodeURIComponent(result.user.email)}`;

      await sendSignupVerificationEmail({
        to: result.user.email,
        verificationCode: result.verificationCode,
        brandName: "theootd.brand",
        verifyUrl,
      });
    } catch (error) {
      console.error("[auth.signup] Failed to send signup verification email", error);
      return NextResponse.json(failure("Could not send signup verification code. Please try again."), { status: 502 });
    }

    return NextResponse.json(
      success(result.alreadyPending ? "A new verification code has been sent to your email." : "Account created. Enter the verification code sent to your email.", {
        email: result.user.email,
        user: {
          id: result.user.id,
          name: result.user.name,
          email: result.user.email,
          role: result.user.role,
        },
      }),
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof DuplicateUserError) {
      return NextResponse.json(failure(error.message), { status: 409 });
    }

    return NextResponse.json(failure("Could not create account"), { status: 500 });
  }
}
