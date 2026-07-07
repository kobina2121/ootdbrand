import { redirect } from "next/navigation";

import { ProfileSettingsForm } from "@/components/account/profile-settings-form";
import { ChangePasswordForm } from "@/components/auth/change-password-form";
import { requireAuthenticatedUser } from "@/lib/auth/guards";
import { getAccountSettingsByUserId } from "@/lib/services/user-service";

export default async function ProfilePage() {
 const session = await requireAuthenticatedUser();

 if (!session?.user) {
 redirect("/login");
 }

 const account = await getAccountSettingsByUserId(session.user.id);

 return (
 <div className="mx-auto w-full max-w-5xl space-y-6">
 <section className="surface-strong p-5 sm:p-7">
 <p className="heading-kicker">MY PROFILE</p>
 <h1 className="mt-2 font-heading text-5xl leading-none text-[#1f1b18] sm:text-6xl">
 Account Settings
 </h1>
 <p className="mt-3 max-w-2xl text-sm text-[#6d6660] sm:text-base">
 Manage your account details, keep your password secure, and sign out safely whenever you need to.
 </p>
 </section>

 <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
 <ProfileSettingsForm
 initialName={account?.name ?? session.user.name ?? "Customer"}
 initialEmail={account?.email ?? session.user.email ?? ""}
 initialPendingEmail={account?.pendingEmail ?? null}
 role={account?.role ?? session.user.role}
 />
 <ChangePasswordForm cardClassName="max-w-none" />
 </div>
 </div>
 );
}
