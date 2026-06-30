import { NextResponse } from "next/server";
import { z } from "zod";

import { failure, success } from "@/lib/api-response";
import { requireAuthenticatedUser } from "@/lib/auth/guards";
import { checkRateLimit, isJsonRequest, isTrustedOrigin } from "@/lib/security/guards";
import { verifyEmailChangeByCode, verifyEmailChangeByToken } from "@/lib/services/user-service";

const verifyEmailChangeSchema = z.union([
  z.object({
    token: z.string().min(20, "Invalid verification token"),
  }),
  z.object({
    code: z.string().trim().length(6, "Enter the 6-digit code"),
  }),
]);

export async function POST(request: Request) {
  try {
    if (!isTrustedOrigin(request)) {
      return NextResponse.json(failure("Invalid request origin."), { status: 403 });
    }

    if (!isJsonRequest(request)) {
      return NextResponse.json(failure("Unsupported content type."), { status: 415 });
    }

    const rateLimit = checkRateLimit(request, {
      bucket: "account:verify-email-change",
      limit: 8,
      windowMs: 15 * 60 * 1000,
    });
    if (!rateLimit.ok) {
      return NextResponse.json(failure("Too many verification attempts. Please wait and retry."), {
        status: 429,
        headers: { "Retry-After": String(rateLimit.retryAfterSeconds) },
      });
    }

    const json = await request.json();
    const parsed = verifyEmailChangeSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(failure("Invalid email verification payload"), { status: 400 });
    }

    let result:
      | Awaited<ReturnType<typeof verifyEmailChangeByToken>>
      | Awaited<ReturnType<typeof verifyEmailChangeByCode>>
      | null;

    if ("token" in parsed.data) {
      result = await verifyEmailChangeByToken(parsed.data.token);
    } else {
      const session = await requireAuthenticatedUser();

      if (!session?.user?.id) {
        return NextResponse.json(failure("Unauthorized"), { status: 401 });
      }

      result = await verifyEmailChangeByCode({
        userId: session.user.id,
        code: parsed.data.code,
      });
    }

    if (!result) {
      return NextResponse.json(failure("Unauthorized"), { status: 401 });
    }

    if (!result.ok) {
      if (result.reason === "duplicate-email") {
        return NextResponse.json(failure("That email is already in use."), { status: 409 });
      }

      return NextResponse.json(failure("Verification code or link is invalid or has expired."), { status: 400 });
    }

    return NextResponse.json(success("Email verified successfully. Sign out and back in to refresh your session email.", {}));
  } catch {
    return NextResponse.json(failure("Could not verify email change"), { status: 500 });
  }
}
