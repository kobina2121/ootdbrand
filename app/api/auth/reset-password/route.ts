import { NextResponse } from "next/server";
import { z } from "zod";

import { failure, success } from "@/lib/api-response";
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
