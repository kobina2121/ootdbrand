import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/lib/auth/options";

export async function getCurrentSession() {
  return getServerSession(authOptions);
}

export async function requireAuthenticatedUser() {
  const session = await getCurrentSession();

  if (!session?.user) {
    return null;
  }

  return session;
}

export async function requireAdminUser() {
  const session = await requireAuthenticatedUser();

  if (!session || session.user.role !== "admin") {
    return null;
  }

  return session;
}

export async function enforceAdminPageAccess(nextPath: string) {
  const session = await requireAdminUser();

  if (!session) {
    redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  }

  return session;
}
