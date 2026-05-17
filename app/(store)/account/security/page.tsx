import { redirect } from "next/navigation";

import { ChangePasswordForm } from "@/components/auth/change-password-form";
import { requireAuthenticatedUser } from "@/lib/auth/guards";

export default async function AccountSecurityPage() {
  const session = await requireAuthenticatedUser();

  if (!session?.user) {
    redirect("/login?next=/account/security");
  }

  return (
    <div className="py-6 sm:py-10">
      <ChangePasswordForm />
    </div>
  );
}
