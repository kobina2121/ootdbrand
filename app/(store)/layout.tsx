import { getServerSession } from "next-auth";

import { AppShell } from "@/components/store/app-shell";
import { CartProvider } from "@/components/store/cart-provider";
import { authOptions } from "@/lib/auth/options";

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  const user = session?.user
    ? {
        name: session.user.name,
        email: session.user.email,
        role: session.user.role,
      }
    : null;

  return (
    <CartProvider userRole={user?.role ?? null}>
      <AppShell user={user}>{children}</AppShell>
    </CartProvider>
  );
}
