"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";

import { UserLogoutButton } from "@/components/store/user-logout-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";

type ProfileSettingsFormProps = {
 initialName: string;
 initialEmail: string;
 initialPendingEmail?: string | null;
 role: "customer" | "admin";
};

type UpdateProfileResponse = {
 ok: boolean;
 message: string;
 data?: {
 user?: {
 name: string;
 email: string;
 };
 emailChanged?: boolean;
 pendingEmail?: string;
 };
};

type VerifyEmailChangeResponse = {
 ok: boolean;
 message: string;
};

export function ProfileSettingsForm({ initialName, initialEmail, initialPendingEmail = null, role }: ProfileSettingsFormProps) {
 const [savedName, setSavedName] = useState(initialName);
 const [savedEmail, setSavedEmail] = useState(initialEmail);
 const [name, setName] = useState(initialName);
 const [email, setEmail] = useState(initialPendingEmail ?? initialEmail);
 const [currentPassword, setCurrentPassword] = useState("");
 const [pendingEmail, setPendingEmail] = useState<string | null>(initialPendingEmail);
 const [verificationCode, setVerificationCode] = useState("");
 const [isVerifyingCode, setIsVerifyingCode] = useState(false);
 const [isSubmitting, setIsSubmitting] = useState(false);
 const [errorMessage, setErrorMessage] = useState<string | null>(null);
 const [successMessage, setSuccessMessage] = useState<string | null>(null);
 const [emailChangedNotice, setEmailChangedNotice] = useState(false);
 const comparisonEmail = pendingEmail ?? savedEmail;
 const normalizedInputEmail = email.trim().toLowerCase();
 const normalizedPendingEmail = pendingEmail?.toLowerCase() ?? null;
 const requiresCurrentPassword =
 normalizedInputEmail !== savedEmail.toLowerCase() && normalizedInputEmail !== normalizedPendingEmail;

 const hasChanges = useMemo(
 () => name.trim() !== savedName || email.trim().toLowerCase() !== comparisonEmail.toLowerCase(),
 [comparisonEmail, email, name, savedName],
 );

 const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
 event.preventDefault();
 setErrorMessage(null);
 setSuccessMessage(null);
 setEmailChangedNotice(false);

 const trimmedName = name.trim();
 const trimmedEmail = email.trim().toLowerCase();

 if (!trimmedName || !trimmedEmail) {
 setErrorMessage("Name and email are required.");
 return;
 }

 if (requiresCurrentPassword && !currentPassword.trim()) {
 setErrorMessage("Current password is required to change your email address.");
 return;
 }

 setIsSubmitting(true);

 try {
 const response = await fetch("/api/account/profile", {
 method: "PATCH",
 headers: {
 "Content-Type": "application/json",
 },
 body: JSON.stringify({
 name: trimmedName,
 email: trimmedEmail,
 currentPassword: currentPassword.trim() || undefined,
 }),
 });

 const json = (await response.json()) as UpdateProfileResponse;

 if (!response.ok || !json.ok) {
 setErrorMessage(json.message || "Could not update profile.");
 return;
 }

 const nextName = json.data?.user?.name ?? trimmedName;
 const nextEmail = json.data?.user?.email ?? savedEmail;
 const nextPendingEmail = json.data?.pendingEmail ?? null;

 setSavedName(nextName);
 setSavedEmail(nextEmail);
 setName(nextName);
 setPendingEmail(nextPendingEmail);
 setEmail(nextPendingEmail ?? nextEmail);
 setCurrentPassword("");
 setSuccessMessage(json.message);
 setEmailChangedNotice(Boolean(json.data?.emailChanged));
 } catch {
 setErrorMessage("Could not update profile.");
 } finally {
 setIsSubmitting(false);
 }
 };

 const onVerifyCode = async () => {
 setErrorMessage(null);
 setSuccessMessage(null);

 if (!verificationCode.trim()) {
 setErrorMessage("Enter the confirmation code sent to your new email.");
 return;
 }

 setIsVerifyingCode(true);

 try {
 const response = await fetch("/api/account/verify-email-change", {
 method: "POST",
 headers: {
 "Content-Type": "application/json",
 },
 body: JSON.stringify({ code: verificationCode.trim() }),
 });

 const json = (await response.json()) as VerifyEmailChangeResponse;

 if (!response.ok || !json.ok) {
 setErrorMessage(json.message || "Could not verify your new email.");
 return;
 }

 const nextEmail = pendingEmail ?? savedEmail;
 setSavedEmail(nextEmail);
 setEmail(nextEmail);
 setPendingEmail(null);
 setVerificationCode("");
 setCurrentPassword("");
 setEmailChangedNotice(true);
 setSuccessMessage(json.message);
 } catch {
 setErrorMessage("Could not verify your new email.");
 } finally {
 setIsVerifyingCode(false);
 }
 };

 return (
 <div className="space-y-6">
 <Card className="rounded-3xl border-black/10 bg-white/90 shadow-sm ">
 <CardHeader className="space-y-2 border-b border-black/10 ">
 <p className="text-xs tracking-[0.24em] text-muted-foreground">PROFILE</p>
 <CardTitle className="font-heading text-5xl leading-none text-[#1f1b18] ">
 Account Details
 </CardTitle>
 <p className="text-sm text-muted-foreground">
 Update your name and email while keeping your account secure.
 </p>
 </CardHeader>
 <CardContent className="space-y-5 pt-6">
 <div className="grid gap-3 rounded-2xl border border-black/10 bg-[#faf9f7] p-4 text-sm text-[#4c443d] sm:grid-cols-3">
 <div>
 <p className="text-[0.65rem] uppercase tracking-[0.18em] text-muted-foreground">Current role</p>
 <p className="mt-1 font-medium capitalize">{role}</p>
 </div>
 <div>
 <p className="text-[0.65rem] uppercase tracking-[0.18em] text-muted-foreground">Email on file</p>
 <p className="mt-1 break-all font-medium">{savedEmail}</p>
 </div>
 <div>
 <p className="text-[0.65rem] uppercase tracking-[0.18em] text-muted-foreground">Security</p>
 <p className="mt-1 font-medium">Password protected</p>
 </div>
 </div>

 <form className="space-y-4" onSubmit={onSubmit}>
 <div className="grid gap-4 sm:grid-cols-2">
 <div className="space-y-2">
 <label className="text-sm font-medium" htmlFor="profile-name">Full name</label>
 <Input
 id="profile-name"
 value={name}
 onChange={(event) => setName(event.target.value)}
 className="h-11 rounded-xl border-black/15 "
 placeholder="Your name"
 />
 </div>
 <div className="space-y-2">
 <label className="text-sm font-medium" htmlFor="profile-email">Email address</label>
 <Input
 id="profile-email"
 type="email"
 value={email}
 onChange={(event) => setEmail(event.target.value)}
 className="h-11 rounded-xl border-black/15 "
 placeholder="you@example.com"
 />
 </div>
 </div>
 {pendingEmail ? (
 <div className="space-y-3 rounded-2xl border border-black/10 bg-[#faf9f7] p-4">
 <p className="text-sm text-[#6b655f] ">
 Verification pending for <span className="font-medium">{pendingEmail}</span>. Enter the 6-digit code we sent there to finish the email change.
 </p>
 <div className="space-y-2">
 <label className="text-sm font-medium" htmlFor="profile-email-code">Confirmation code</label>
 <Input
 id="profile-email-code"
 inputMode="numeric"
 value={verificationCode}
 onChange={(event) => setVerificationCode(event.target.value.replace(/\D+/g, "").slice(0, 6))}
 className="h-11 rounded-xl border-black/15 text-center tracking-[0.3em] "
 placeholder="123456"
 />
 </div>
 <div className="flex flex-wrap gap-3">
 <Button type="button" className="h-11 rounded-full px-6" disabled={isVerifyingCode} onClick={() => void onVerifyCode()}>
 {isVerifyingCode ? "Verifying..." : "Verify New Email"}
 </Button>
 <p className="self-center text-xs text-muted-foreground">
 Your login email will not change until the code is confirmed.
 </p>
 </div>
 </div>
 ) : null}
 {requiresCurrentPassword ? (
 <div className="space-y-2">
 <label className="text-sm font-medium" htmlFor="profile-current-password">Current password</label>
 <PasswordInput
 id="profile-current-password"
 value={currentPassword}
 onChange={(event) => setCurrentPassword(event.target.value)}
 className="h-11 rounded-xl border-black/15 "
 placeholder="Enter current password to verify this email change"
 />
 </div>
 ) : null}
 {errorMessage ? <p className="text-sm text-destructive">{errorMessage}</p> : null}
 {successMessage ? <p className="text-sm text-emerald-700">{successMessage}</p> : null}
 {emailChangedNotice ? (
 <p className="text-sm text-[#6b655f] ">
 Your email was updated. Sign out and sign back in to refresh it across the whole site.
 </p>
 ) : null}
 {!emailChangedNotice && pendingEmail ? (
 <p className="text-sm text-[#6b655f] ">Your login email will not change until you verify the new address.</p>
 ) : null}
 <div className="flex flex-wrap items-center gap-3">
 <Button type="submit" className="h-11 rounded-full px-6" disabled={isSubmitting || !hasChanges}>
 {isSubmitting ? "Saving..." : "Save Changes"}
 </Button>
 <Link href="/orders">
 <Button type="button" variant="ghost" className="h-11 rounded-full px-6">
 View Orders
 </Button>
 </Link>
 </div>
 </form>
 </CardContent>
 </Card>

 <Card className="rounded-3xl border-black/10 bg-white/90 shadow-sm ">
 <CardHeader className="space-y-2 border-b border-black/10 ">
 <p className="text-xs tracking-[0.24em] text-muted-foreground">SESSION</p>
 <CardTitle className="font-heading text-4xl leading-none text-[#1f1b18] ">
 Logout
 </CardTitle>
 <p className="text-sm text-muted-foreground">
 Use this if you are on a shared device or want to switch accounts safely.
 </p>
 </CardHeader>
 <CardContent className="pt-6">
 <UserLogoutButton className="h-11 rounded-full border-black/15 bg-white px-6 " />
 </CardContent>
 </Card>
 </div>
 );
}
