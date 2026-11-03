import { redirect } from "next/navigation";

import { PageMasthead } from "@/components/store/page-masthead";
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
 <PageMasthead
 kicker="My Profile"
 title="Account Settings"
 description="Manage your account details, keep your password secure, and sign out safely whenever you need to."
 />

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
