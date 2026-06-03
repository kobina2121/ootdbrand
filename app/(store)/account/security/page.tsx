import { redirect } from "next/navigation";

import { requireAuthenticatedUser } from "@/lib/auth/guards";

export default async function AccountSecurityPage() {
  const session = await requireAuthenticatedUser();

  if (!session?.user) {
    redirect("/login?next=/account/security");
  }

  redirect("/profile");
}
