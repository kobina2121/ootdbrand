"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type VerifyEmailChangeResponse = {
  ok: boolean;
  message: string;
};

export function VerifyEmailChangeForm({ token }: { token?: string }) {
  const [errorMessage, setErrorMessage] = useState<string | null>(
    token ? null : "Verification token is missing. Request a new email change from your profile.",
  );
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(Boolean(token));

  useEffect(() => {
    if (!token) {
      return;
    }

    let isMounted = true;

    const verifyEmail = async () => {
      try {
        const response = await fetch("/api/account/verify-email-change", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ token }),
        });

        const json = (await response.json()) as VerifyEmailChangeResponse;

        if (!isMounted) {
          return;
        }

        if (!response.ok || !json.ok) {
          setErrorMessage(json.message || "Could not verify email change.");
          return;
        }

        setSuccessMessage(json.message);
      } catch {
        if (!isMounted) {
          return;
        }

        setErrorMessage("Could not verify email change.");
      } finally {
        if (isMounted) {
          setIsSubmitting(false);
        }
      }
    };

    void verifyEmail();

    return () => {
      isMounted = false;
    };
  }, [token]);

  return (
    <Card className="mx-auto w-full max-w-md rounded-3xl border-black/10 bg-white/90 shadow-sm ">
      <CardHeader className="space-y-2 border-b border-black/10 ">
        <p className="text-xs tracking-[0.24em] text-muted-foreground">ACCOUNT SECURITY</p>
        <CardTitle className="font-heading text-5xl leading-none ">Verify Email</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isSubmitting ? <p className="text-sm text-muted-foreground">Verifying your new email address...</p> : null}
        {errorMessage ? <p className="text-sm text-destructive">{errorMessage}</p> : null}
        {successMessage ? <p className="text-sm text-emerald-700">{successMessage}</p> : null}
        <div className="flex flex-wrap gap-3">
          <Link href="/profile">
            <Button className="rounded-full">Back to Profile</Button>
          </Link>
          <Link href="/login">
            <Button type="button" variant="outline" className="rounded-full">
              Go to Login
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
