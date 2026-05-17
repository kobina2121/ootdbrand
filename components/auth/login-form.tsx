"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { getProviders, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export function LoginForm({ nextPath = "/" }: { nextPath?: string }) {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);
  const [isGoogleAvailable, setIsGoogleAvailable] = useState(false);

  useEffect(() => {
    let isMounted = true;

    if (nextPath.startsWith("/admin")) {
      return () => {
        isMounted = false;
      };
    }

    getProviders()
      .then((providers) => {
        if (!isMounted) {
          return;
        }

        setIsGoogleAvailable(Boolean(providers?.google));
      })
      .catch(() => {
        if (!isMounted) {
          return;
        }

        setIsGoogleAvailable(false);
      });

    return () => {
      isMounted = false;
    };
  }, [nextPath]);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "").trim();

    if (!email || !password) {
      setErrorMessage("Email and password are required.");
      return;
    }

    setIsSubmitting(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setIsSubmitting(false);

    if (!result?.ok) {
      setErrorMessage("Invalid credentials. Please try again.");
      return;
    }

    router.push(nextPath);
    router.refresh();
  };

  const onGoogleSignIn = async () => {
    setErrorMessage(null);
    setIsGoogleSubmitting(true);

    await signIn("google", {
      callbackUrl: nextPath.startsWith("/admin") ? "/" : nextPath || "/orders",
    });
  };

  return (
    <Card className="mx-auto w-full max-w-md rounded-3xl border-black/10 bg-white/90 shadow-sm">
      <CardHeader className="space-y-2 border-b border-black/10">
        <p className="text-xs tracking-[0.24em] text-muted-foreground">
          {nextPath.startsWith("/admin") ? "ADMIN ACCESS" : "WELCOME BACK"}
        </p>
        <CardTitle className="font-heading text-5xl leading-none">
          {nextPath.startsWith("/admin") ? "Admin Login" : "Login"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!nextPath.startsWith("/admin") ? (
          <>
            {isGoogleAvailable ? (
              <Button
                type="button"
                variant="outline"
                className="mb-4 h-11 w-full rounded-full border-black/20"
                onClick={onGoogleSignIn}
                disabled={isGoogleSubmitting || isSubmitting}
              >
                <svg aria-hidden="true" viewBox="0 0 48 48" className="mr-2 size-4">
                  <path
                    fill="#FFC107"
                    d="M43.61 20.08H42V20H24v8h11.3C33.65 32.66 29.19 36 24 36c-6.63 0-12-5.37-12-12s5.37-12 12-12c3.06 0 5.85 1.15 7.96 3.04l5.66-5.66C34.07 6.05 29.29 4 24 4 12.95 4 4 12.95 4 24s8.95 20 20 20 20-8.95 20-20c0-1.34-.14-2.65-.39-3.92z"
                  />
                  <path
                    fill="#FF3D00"
                    d="M6.31 14.69l6.57 4.82C14.66 15.11 18.96 12 24 12c3.06 0 5.85 1.15 7.96 3.04l5.66-5.66C34.07 6.05 29.29 4 24 4 16.32 4 9.66 8.34 6.31 14.69z"
                  />
                  <path
                    fill="#4CAF50"
                    d="M24 44c5.19 0 9.93-1.99 13.51-5.23l-6.2-5.24C29.24 35.06 26.73 36 24 36c-5.17 0-9.62-3.32-11.26-7.93l-6.52 5.02C9.53 39.57 16.26 44 24 44z"
                  />
                  <path
                    fill="#1976D2"
                    d="M43.61 20.08H42V20H24v8h11.3c-.79 2.37-2.31 4.39-4.29 5.53l6.2 5.24C36.77 39.19 44 34 44 24c0-1.34-.14-2.65-.39-3.92z"
                  />
                </svg>
                {isGoogleSubmitting ? "Redirecting..." : "Continue with Google"}
              </Button>
            ) : (
              <p className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                Google sign-in is currently unavailable. Please use email and password.
              </p>
            )}
            <div className="mb-4 flex items-center gap-3">
              <div className="h-px flex-1 bg-black/10" />
              <span className="text-xs tracking-[0.2em] text-muted-foreground">OR</span>
              <div className="h-px flex-1 bg-black/10" />
            </div>
          </>
        ) : null}
        <form className="space-y-4" onSubmit={onSubmit}>
          <Input
            name="email"
            type="email"
            placeholder={nextPath.startsWith("/admin") ? "admin@theootd.brand" : "you@example.com"}
            className="h-11 rounded-xl border-black/15"
            required
          />
          <Input name="password" type="password" placeholder="Password" className="h-11 rounded-xl border-black/15" required />
          {!nextPath.startsWith("/admin") ? (
            <div className="text-center">
              <Link href="/forgot-password" className="text-sm font-medium text-foreground underline underline-offset-4">
                Forgot password?
              </Link>
            </div>
          ) : null}
          {errorMessage ? <p className="text-sm text-destructive">{errorMessage}</p> : null}
          <Button className="h-11 w-full rounded-full" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Signing in..." : "Login"}
          </Button>
        </form>
        {nextPath.startsWith("/admin") ? (
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Admin accounts are provisioned by the store owner.
          </p>
        ) : (
          <p className="mt-4 text-center text-sm text-muted-foreground">
            New here?{" "}
            <Link href="/signup" className="font-medium text-foreground underline underline-offset-4">
              Create account
            </Link>
          </p>
        )}
      </CardContent>
    </Card>
  );
}
