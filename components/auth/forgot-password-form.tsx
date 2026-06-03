"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type ForgotPasswordResponse = {
  ok: boolean;
  message: string;
};

export function ForgotPasswordForm() {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim();

    if (!email) {
      setErrorMessage("Email is required.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const json = (await response.json()) as ForgotPasswordResponse;

      if (!response.ok || !json.ok) {
        setErrorMessage(json.message || "Could not start password reset.");
        return;
      }

      setSuccessMessage(json.message);
    } catch {
      setErrorMessage("Could not start password reset.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="mx-auto w-full max-w-md rounded-3xl border-black/10 bg-white/90 shadow-sm dark:border-white/10 dark:bg-[#181513]/90">
      <CardHeader className="space-y-2 border-b border-black/10 dark:border-white/10">
        <p className="text-xs tracking-[0.24em] text-muted-foreground">ACCOUNT RECOVERY</p>
        <CardTitle className="font-heading text-5xl leading-none dark:text-[#faf3eb]">Forgot Password</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={onSubmit}>
          <Input name="email" type="email" placeholder="Enter your email" className="h-11 rounded-xl border-black/15 dark:border-white/15 dark:bg-[#221d19] dark:text-[#faf3eb] dark:placeholder:text-[#9f9388]" required />
          {errorMessage ? <p className="text-sm text-destructive">{errorMessage}</p> : null}
          {successMessage ? <p className="text-sm text-emerald-700 dark:text-emerald-300">{successMessage}</p> : null}
          <Button className="h-11 w-full rounded-full" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Please wait..." : "Send Reset Link"}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          Remembered your password?{" "}
          <Link href="/login" className="font-medium text-foreground underline underline-offset-4 dark:text-[#faf3eb]">
            Back to login
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
