import { NextResponse } from "next/server";
import { z } from "zod";

import { failure, success } from "@/lib/api-response";
import { checkRateLimit, isJsonRequest, isTrustedOrigin } from "@/lib/security/guards";
import { resetPasswordByToken } from "@/lib/services/user-service";

const resetPasswordSchema = z.object({
  token: z.string().min(20, "Invalid reset token"),
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
      bucket: "auth:reset-password",
      limit: 8,
      windowMs: 15 * 60 * 1000,
    });
    if (!rateLimit.ok) {
      return NextResponse.json(failure("Too many reset attempts. Please wait and retry."), {
        status: 429,
        headers: { "Retry-After": String(rateLimit.retryAfterSeconds) },
      });
    }

    const json = await request.json();
    const parsed = resetPasswordSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(failure("Invalid password reset payload"), { status: 400 });
    }

    const updated = await resetPasswordByToken(parsed.data.token, parsed.data.password);

    if (!updated) {
      return NextResponse.json(failure("Reset link is invalid or has expired."), { status: 400 });
    }

    return NextResponse.json(success("Password reset successful. You can now sign in.", {}));
  } catch {
    return NextResponse.json(failure("Could not reset password"), { status: 500 });
  }
}
