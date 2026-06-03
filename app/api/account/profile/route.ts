import { NextResponse } from "next/server";
import { z } from "zod";

import { failure, success } from "@/lib/api-response";
import { requireAuthenticatedUser } from "@/lib/auth/guards";
import { checkRateLimit, isJsonRequest, isTrustedOrigin } from "@/lib/security/guards";
import { updateProfileForUser } from "@/lib/services/user-service";

const updateProfileSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters."),
  email: z.string().trim().email("Enter a valid email address."),
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

    const result = await updateProfileForUser({
      userId: session.user.id,
      name: parsed.data.name,
      email: parsed.data.email,
    });

    if (!result.ok) {
      if (result.reason === "duplicate-email") {
        return NextResponse.json(failure("That email is already in use."), { status: 409 });
      }

      return NextResponse.json(failure("User account not found."), { status: 404 });
    }

    return NextResponse.json(
      success("Profile updated successfully.", {
        user: result.user,
        emailChanged: result.emailChanged,
      }),
    );
  } catch {
    return NextResponse.json(failure("Could not update profile."), { status: 500 });
  }
}
