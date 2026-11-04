"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type VerifySignupFormProps = {
  initialEmail?: string;
};

type VerifySignupResponse = {
  ok: boolean;
  message: string;
};

export function VerifySignupForm({ initialEmail = "" }: VerifySignupFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const trimmedEmail = email.trim().toLowerCase();
    const trimmedCode = code.trim();

    if (!trimmedEmail || !trimmedCode) {
      setErrorMessage("Email and verification code are required.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/verify-signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: trimmedEmail,
          code: trimmedCode,
        }),
      });

      const json = (await response.json()) as VerifySignupResponse;

      if (!response.ok || !json.ok) {
        setErrorMessage(json.message || "Could not verify your email.");
        return;
      }

      setSuccessMessage(json.message);
      setCode("");
      router.prefetch("/login");
    } catch {
      setErrorMessage("Could not verify your email.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="mx-auto w-full max-w-md rounded-3xl border-black/10 bg-white/90 shadow-sm ">
      <CardHeader className="space-y-2 border-b border-black/10 ">
        <p className="text-xs tracking-[0.24em] text-muted-foreground">EMAIL CONFIRMATION</p>
        <CardTitle className="font-heading text-5xl leading-none ">Verify Account</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Enter the 6-digit confirmation code we sent to your email before logging in.
        </p>
        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="space-y-2">
            <label htmlFor="verify-signup-email" className="text-sm font-medium ">
              Email
            </label>
            <Input
              id="verify-signup-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="h-11 rounded-xl border-black/15 "
              placeholder="you@example.com"
              required
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="verify-signup-code" className="text-sm font-medium ">
              Confirmation code
            </label>
            <Input
              id="verify-signup-code"
              inputMode="numeric"
              value={code}
              onChange={(event) => setCode(event.target.value.replace(/\D+/g, "").slice(0, 6))}
              className="h-11 rounded-xl border-black/15 text-center tracking-[0.3em] "
              placeholder="123456"
              required
            />
          </div>
          {errorMessage ? <p className="text-sm text-destructive">{errorMessage}</p> : null}
          {successMessage ? <p className="text-sm text-emerald-700">{successMessage}</p> : null}
          <Button className="h-11 w-full rounded-full" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Verifying..." : "Verify Email"}
          </Button>
        </form>
        <div className="flex flex-wrap gap-3">
          <Link href="/signup">
            <Button type="button" variant="outline" className="rounded-full">
              Back to Signup
            </Button>
          </Link>
          <Link href="/login">
            <Button type="button" variant="ghost" className="rounded-full">
              Go to Login
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
