import { NextResponse } from "next/server";
import { z } from "zod";

import { failure, success } from "@/lib/api-response";
import { checkRateLimit, isJsonRequest, isTrustedOrigin } from "@/lib/security/guards";
import { verifySignupCode } from "@/lib/services/user-service";

const verifySignupSchema = z.object({
  email: z.string().trim().email("Enter a valid email address"),
  code: z.string().trim().length(6, "Enter the 6-digit code"),
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
      bucket: "auth:verify-signup",
      limit: 8,
      windowMs: 15 * 60 * 1000,
    });
    if (!rateLimit.ok) {
      return NextResponse.json(failure("Too many verification attempts. Please wait and try again."), {
        status: 429,
        headers: { "Retry-After": String(rateLimit.retryAfterSeconds) },
      });
    }

    const json = await request.json();
    const parsed = verifySignupSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(failure("Invalid signup verification payload"), { status: 400 });
    }

    const result = await verifySignupCode(parsed.data);

    if (!result.ok) {
      return NextResponse.json(failure("Verification code is invalid or has expired."), { status: 400 });
    }

    return NextResponse.json(success("Email verified. You can now log in to your account.", {}));
  } catch {
    return NextResponse.json(failure("Could not verify signup email"), { status: 500 });
  }
}
