import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { getCurrentSession } from "@/lib/auth/guards";

export default async function ForgotPasswordPage() {
  const session = await getCurrentSession();

  return (
    <div className="py-6 sm:py-10">
      <ForgotPasswordForm lockedEmail={session?.user?.email ?? null} />
    </div>
  );
}
