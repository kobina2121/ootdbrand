import { VerifyEmailChangeForm } from "@/components/account/verify-email-change-form";

type VerifyEmailChangePageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function VerifyEmailChangePage({ searchParams }: VerifyEmailChangePageProps) {
  const params = await searchParams;
  const token = typeof params.token === "string" ? params.token : undefined;

  return (
    <div className="py-6 sm:py-10">
      <VerifyEmailChangeForm token={token} />
    </div>
  );
}
