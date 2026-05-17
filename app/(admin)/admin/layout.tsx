import { Bell } from "lucide-react";

import { AdminLogoutButton } from "@/components/admin/admin-logout-button";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { Button } from "@/components/ui/button";
import { enforceAdminPageAccess } from "@/lib/auth/guards";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await enforceAdminPageAccess("/admin/products");

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#ffffff,_#f5f6f8_40%,_#eceef2_100%)]">
      <div className="mx-auto w-full max-w-[1440px] px-4 py-6 lg:px-8">
        <div className="flex flex-col gap-6 md:flex-row">
          <AdminSidebar />
          <section className="flex-1 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-black/10 bg-white/80 px-4 py-3 shadow-sm backdrop-blur">
              <div>
                <p className="text-[0.72rem] uppercase tracking-[0.16em] text-muted-foreground">Dashboard</p>
                <p className="text-base font-medium">Signed in as {session.user.email}</p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="rounded-full border border-black/10">
                  <Bell className="size-4" />
                  <span className="sr-only">Alerts</span>
                </Button>
                <AdminLogoutButton />
              </div>
            </div>
            {children}
          </section>
        </div>
      </div>
    </div>
  );
}
