import { NextResponse } from "next/server";

import { success } from "@/lib/api-response";
import { getAuthSecret } from "@/lib/auth/session-config";

export async function GET() {
  const googleClientId = process.env.GOOGLE_CLIENT_ID?.trim() ?? "";
  const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim() ?? "";

  let hasAuthSecret = false;
  try {
    hasAuthSecret = Boolean(getAuthSecret());
  } catch {
    hasAuthSecret = false;
  }

  const enabled = Boolean(googleClientId && googleClientSecret && hasAuthSecret);

  return NextResponse.json(
    success("Google auth status fetched", {
      enabled,
      reason: enabled ? "configured" : "missing-config",
    }),
  );
}
