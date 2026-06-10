import { Bell } from "lucide-react";
import Link from "next/link";

import { AdminLogoutButton } from "@/components/admin/admin-logout-button";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { Button } from "@/components/ui/button";
import { enforceAdminPageAccess } from "@/lib/auth/guards";
import { getUnreadAdminNotificationCount } from "@/lib/services/admin-notification-service";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
 const session = await enforceAdminPageAccess("/admin/products");
 const unreadNotifications = await getUnreadAdminNotificationCount();

 return (
 <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#ffffff,_#f5f6f8_40%,_#eceef2_100%)] transition-colors ">
 <div className="mx-auto w-full max-w-[1440px] px-4 py-5 sm:px-6 lg:px-8">
 <div className="flex flex-col gap-5 lg:flex-row">
 <AdminSidebar />
 <section className="flex-1 space-y-4">
 <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-black/10 bg-white/80 px-4 py-3 shadow-sm backdrop-blur transition-colors ">
 <div>
 <p className="text-[0.72rem] uppercase tracking-[0.16em] text-muted-foreground">Dashboard</p>
 <p className="text-base font-medium">Signed in as {session.user.email}</p>
 </div>
 <div className="flex items-center gap-2">
 <Link href="/admin/notifications" className="relative">
 <Button
 variant="ghost"
 size="icon"
 className="rounded-full border border-black/10 transition-colors "
 >
 <Bell className="size-4" />
 <span className="sr-only">Alerts</span>
 </Button>
 {unreadNotifications > 0 ? (
 <span className="absolute -right-1 -top-1 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-black px-1 text-[10px] font-semibold text-white ">
 {unreadNotifications > 99 ? "99+" : unreadNotifications}
 </span>
 ) : null}
 </Link>
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
