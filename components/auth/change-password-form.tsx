"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type ChangePasswordResponse = {
  ok: boolean;
  message: string;
};

type ChangePasswordFormProps = {
  cardClassName?: string;
};

export function ChangePasswordForm({ cardClassName }: ChangePasswordFormProps) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const formData = new FormData(event.currentTarget);
    const currentPassword = String(formData.get("currentPassword") ?? "").trim();
    const newPassword = String(formData.get("newPassword") ?? "").trim();
    const confirmPassword = String(formData.get("confirmPassword") ?? "").trim();

    if (!currentPassword || !newPassword || !confirmPassword) {
      setErrorMessage("All fields are required.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage("New passwords do not match.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const json = (await response.json()) as ChangePasswordResponse;

      if (!response.ok || !json.ok) {
        setErrorMessage(json.message || "Could not change password.");
        return;
      }

      setSuccessMessage(json.message);
      event.currentTarget.reset();
    } catch {
      setErrorMessage("Could not change password.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className={`mx-auto w-full max-w-md rounded-3xl border-black/10 bg-white/90 shadow-sm ${cardClassName ?? ""}`}>
      <CardHeader className="space-y-2 border-b border-black/10">
        <p className="text-xs tracking-[0.24em] text-muted-foreground">ACCOUNT SECURITY</p>
        <CardTitle className="font-heading text-5xl leading-none">Change Password</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={onSubmit}>
          <Input name="currentPassword" type="password" placeholder="Current password" className="h-11 rounded-xl border-black/15" required />
          <Input
            name="newPassword"
            type="password"
            placeholder="New password (min 8 chars, letters + numbers)"
            className="h-11 rounded-xl border-black/15"
            required
          />
          <Input name="confirmPassword" type="password" placeholder="Confirm new password" className="h-11 rounded-xl border-black/15" required />
          {errorMessage ? <p className="text-sm text-destructive">{errorMessage}</p> : null}
          {successMessage ? <p className="text-sm text-emerald-700">{successMessage}</p> : null}
          <Button className="h-11 w-full rounded-full" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Updating..." : "Update Password"}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          Forgot current password?{" "}
          <Link href="/forgot-password" className="font-medium text-foreground underline underline-offset-4">
            Reset it here
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
