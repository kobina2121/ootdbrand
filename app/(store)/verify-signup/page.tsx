import { VerifySignupForm } from "@/components/auth/verify-signup-form";

type VerifySignupPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function VerifySignupPage({ searchParams }: VerifySignupPageProps) {
  const params = await searchParams;
  const email = typeof params.email === "string" ? params.email : "";

  return (
    <div className="space-y-6">
      <section className="surface-strong p-5 sm:p-7">
        <p className="heading-kicker">ACCOUNT</p>
        <h1 className="mt-2 font-heading text-5xl leading-none text-[#1f1b18] sm:text-6xl">Verify Signup</h1>
        <p className="mt-2 text-sm text-[#6d6660] sm:text-base">
          Confirm your email with the code we sent before your first login.
        </p>
      </section>
      <VerifySignupForm initialEmail={email} />
    </div>
  );
}
