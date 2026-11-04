"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PasswordInput } from "@/components/ui/password-input";

type ResetPasswordResponse = {
 ok: boolean;
 message: string;
};

export function ResetPasswordForm({ token }: { token?: string }) {
 const router = useRouter();
 const [errorMessage, setErrorMessage] = useState<string | null>(null);
 const [successMessage, setSuccessMessage] = useState<string | null>(null);
 const [isSubmitting, setIsSubmitting] = useState(false);

 const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
 event.preventDefault();
 setErrorMessage(null);
 setSuccessMessage(null);

 if (!token) {
 setErrorMessage("Reset token is missing. Request a new reset link.");
 return;
 }

 const formData = new FormData(event.currentTarget);
 const password = String(formData.get("password") ?? "").trim();
 const confirmPassword = String(formData.get("confirmPassword") ?? "").trim();

 if (!password || !confirmPassword) {
 setErrorMessage("Both password fields are required.");
 return;
 }

 if (password !== confirmPassword) {
 setErrorMessage("Passwords do not match.");
 return;
 }

 setIsSubmitting(true);

 try {
 const response = await fetch("/api/auth/reset-password", {
 method: "POST",
 headers: {
 "Content-Type": "application/json",
 },
 body: JSON.stringify({ token, password }),
 });

 const json = (await response.json()) as ResetPasswordResponse;

 if (!response.ok || !json.ok) {
 setErrorMessage(json.message || "Could not reset password.");
 return;
 }

 setSuccessMessage(json.message);
 setTimeout(() => {
 router.push("/login");
 }, 800);
 } catch {
 setErrorMessage("Could not reset password.");
 } finally {
 setIsSubmitting(false);
 }
 };

 return (
 <Card className="mx-auto w-full max-w-md rounded-3xl border-black/10 bg-white/90 shadow-sm ">
 <CardHeader className="space-y-2 border-b border-black/10 ">
 <p className="text-xs tracking-[0.24em] text-muted-foreground">ACCOUNT RECOVERY</p>
 <CardTitle className="font-heading text-5xl leading-none ">Reset Password</CardTitle>
 </CardHeader>
 <CardContent>
 <form className="space-y-4" onSubmit={onSubmit}>
 <PasswordInput
 name="password"
 placeholder="New password (min 8 chars, letters + numbers)"
 className="h-11 rounded-xl border-black/15 "
 required
 />
 <PasswordInput name="confirmPassword" placeholder="Confirm new password" className="h-11 rounded-xl border-black/15 " required />
 {errorMessage ? <p className="text-sm text-destructive">{errorMessage}</p> : null}
 {successMessage ? <p className="text-sm text-emerald-700 ">{successMessage}</p> : null}
 <Button className="h-11 w-full rounded-full" type="submit" disabled={isSubmitting}>
 {isSubmitting ? "Resetting..." : "Reset Password"}
 </Button>
 </form>
 <p className="mt-4 text-center text-sm text-muted-foreground">
 Need another link?{" "}
 <Link href="/forgot-password" className="font-medium text-foreground underline underline-offset-4 ">
 Request again
 </Link>
 </p>
 </CardContent>
 </Card>
 );
}
