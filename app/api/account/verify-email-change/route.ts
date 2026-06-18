import { NextResponse } from "next/server";
import { z } from "zod";

import { failure, success } from "@/lib/api-response";
import { checkRateLimit, isJsonRequest, isTrustedOrigin } from "@/lib/security/guards";
import { verifyEmailChangeByToken } from "@/lib/services/user-service";

const verifyEmailChangeSchema = z.object({
  token: z.string().min(20, "Invalid verification token"),
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

    const result = await verifyEmailChangeByToken(parsed.data.token);

    if (!result.ok) {
      if (result.reason === "duplicate-email") {
        return NextResponse.json(failure("That email is already in use."), { status: 409 });
      }

      return NextResponse.json(failure("Verification link is invalid or has expired."), { status: 400 });
    }

    return NextResponse.json(success("Email verified successfully. Sign out and back in to refresh your session email.", {}));
  } catch {
    return NextResponse.json(failure("Could not verify email change"), { status: 500 });
  }
}
