import { NextResponse } from "next/server";
import { z } from "zod";

import { failure, success } from "@/lib/api-response";
import { requireAuthenticatedUser } from "@/lib/auth/guards";
import { checkRateLimit, isJsonRequest, isTrustedOrigin } from "@/lib/security/guards";
import { changePasswordForUser } from "@/lib/services/user-service";

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Za-z]/, "Password must include letters")
    .regex(/[0-9]/, "Password must include numbers"),
});

export async function POST(request: Request) {
  if (!isTrustedOrigin(request)) {
    return NextResponse.json(failure("Invalid request origin."), { status: 403 });
  }

  if (!isJsonRequest(request)) {
    return NextResponse.json(failure("Unsupported content type."), { status: 415 });
  }

  const rateLimit = checkRateLimit(request, {
    bucket: "auth:change-password",
    limit: 10,
    windowMs: 15 * 60 * 1000,
  });
  if (!rateLimit.ok) {
    return NextResponse.json(failure("Too many password change attempts. Try again shortly."), {
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
    const parsed = changePasswordSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(failure("Invalid password details"), { status: 400 });
    }

    const result = await changePasswordForUser({
      userId: session.user.id,
      currentPassword: parsed.data.currentPassword,
      newPassword: parsed.data.newPassword,
    });

    if (!result.ok) {
      if (result.reason === "invalid-current-password") {
        return NextResponse.json(failure("Current password is incorrect."), { status: 400 });
      }

      if (result.reason === "same-password") {
        return NextResponse.json(failure("New password must be different from current password."), { status: 400 });
      }

      if (result.reason === "password-not-set") {
        return NextResponse.json(failure("This account uses social login. Use forgot password to set a password first."), {
          status: 400,
        });
      }

      return NextResponse.json(failure("User account not found."), { status: 404 });
    }

    return NextResponse.json(success("Password updated successfully.", {}));
  } catch {
    return NextResponse.json(failure("Could not change password"), { status: 500 });
  }
}
