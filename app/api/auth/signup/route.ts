import { NextResponse } from "next/server";
import { z } from "zod";

import { failure, success } from "@/lib/api-response";
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
    const json = await request.json();
    const parsed = signupSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(failure("Invalid signup details"), { status: 400 });
    }

    const user = await createCustomerUser(parsed.data);

    return NextResponse.json(
      success("Account created successfully", {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
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
