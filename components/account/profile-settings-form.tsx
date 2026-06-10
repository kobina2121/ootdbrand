"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";

import { UserLogoutButton } from "@/components/store/user-logout-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type ProfileSettingsFormProps = {
 initialName: string;
 initialEmail: string;
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
 };
};

export function ProfileSettingsForm({ initialName, initialEmail, role }: ProfileSettingsFormProps) {
 const [name, setName] = useState(initialName);
 const [email, setEmail] = useState(initialEmail);
 const [isSubmitting, setIsSubmitting] = useState(false);
 const [errorMessage, setErrorMessage] = useState<string | null>(null);
 const [successMessage, setSuccessMessage] = useState<string | null>(null);
 const [emailChangedNotice, setEmailChangedNotice] = useState(false);

 const hasChanges = useMemo(
 () => name.trim() !== initialName || email.trim().toLowerCase() !== initialEmail.toLowerCase(),
 [email, initialEmail, initialName, name],
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
 }),
 });

 const json = (await response.json()) as UpdateProfileResponse;

 if (!response.ok || !json.ok) {
 setErrorMessage(json.message || "Could not update profile.");
 return;
 }

 setName(json.data?.user?.name ?? trimmedName);
 setEmail(json.data?.user?.email ?? trimmedEmail);
 setSuccessMessage(json.message);
 setEmailChangedNotice(Boolean(json.data?.emailChanged));
 } catch {
 setErrorMessage("Could not update profile.");
 } finally {
 setIsSubmitting(false);
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
 <p className="mt-1 break-all font-medium">{initialEmail}</p>
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
 {errorMessage ? <p className="text-sm text-destructive">{errorMessage}</p> : null}
 {successMessage ? <p className="text-sm text-emerald-700">{successMessage}</p> : null}
 {emailChangedNotice ? (
 <p className="text-sm text-[#6b655f] ">
 Your email was updated. Sign out and sign back in to refresh it across the whole site.
 </p>
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
