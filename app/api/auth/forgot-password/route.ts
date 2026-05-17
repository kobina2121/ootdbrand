import { NextResponse } from "next/server";
import { z } from "zod";

import { failure, success } from "@/lib/api-response";
import { isSmtpConfigured, sendResetPasswordEmail } from "@/lib/email/smtp";
import { requestPasswordReset } from "@/lib/services/user-service";

const forgotPasswordSchema = z.object({
  email: z.string().email("Enter a valid email address"),
});

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const parsed = forgotPasswordSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(failure("Invalid request"), { status: 400 });
    }

    const result = await requestPasswordReset(parsed.data.email);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || "http://localhost:3000";
    const resetUrl = result.requested ? `${appUrl}/reset-password?token=${result.token}` : undefined;

    if (result.requested && resetUrl) {
      if (isSmtpConfigured()) {
        await sendResetPasswordEmail({
          to: parsed.data.email,
          resetUrl,
          brandName: "theootd.brand",
        });
      } else if (process.env.NODE_ENV !== "development") {
        return NextResponse.json(failure("Password reset email service is not configured."), { status: 500 });
      }
    }

    return NextResponse.json(
      success("If an account exists for this email, a reset link has been prepared.", {
        resetUrl: process.env.NODE_ENV === "development" ? resetUrl : undefined,
      }),
    );
  } catch {
    return NextResponse.json(failure("Could not process password reset"), { status: 500 });
  }
}
