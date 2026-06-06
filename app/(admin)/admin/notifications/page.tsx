import Link from "next/link";
import { BellRing } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { markAllAdminNotificationsRead, listAdminNotifications } from "@/lib/services/admin-notification-service";

export default async function AdminNotificationsPage() {
  const notifications = await listAdminNotifications(100);

  async function markAllReadAction() {
    "use server";
    await markAllAdminNotificationsRead();
  }

  return (
    <div className="space-y-5">
      <Card className="border-black/10 bg-white/85 shadow-sm dark:border-white/10 dark:bg-zinc-950/75 dark:shadow-black/30">
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <div>
            <p className="text-[0.72rem] uppercase tracking-[0.16em] text-muted-foreground">Alerts</p>
            <CardTitle className="font-sans text-2xl font-semibold">Order Notifications</CardTitle>
          </div>
          <form action={markAllReadAction}>
            <Button type="submit" variant="outline" className="rounded-full dark:border-white/15 dark:bg-white/[0.03] dark:text-white/80 dark:hover:bg-white/[0.06]">
              Mark all as read
            </Button>
          </form>
        </CardHeader>
      </Card>

      <Card className="border-black/10 bg-white/90 shadow-sm dark:border-white/10 dark:bg-zinc-950/80 dark:shadow-black/30">
        <CardContent className="space-y-3 p-4">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-center text-muted-foreground">
              <BellRing className="size-6" />
              <p>No notifications yet.</p>
            </div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className={`rounded-xl border px-4 py-3 ${notification.unread ? "border-black/20 bg-black/[0.02] dark:border-white/15 dark:bg-white/[0.06]" : "border-black/10 bg-white dark:border-white/10 dark:bg-white/[0.03]"}`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold">{notification.title}</p>
                      {notification.unread ? <Badge className="rounded-full">New</Badge> : null}
                    </div>
                    <p className="text-sm text-muted-foreground">{notification.message}</p>
                    <p className="text-xs text-muted-foreground">{new Date(notification.createdAt).toLocaleString()}</p>
                  </div>
                  <Link href={notification.link}>
                    <Button size="sm" variant="outline" className="rounded-full dark:border-white/15 dark:bg-white/[0.03] dark:text-white/80 dark:hover:bg-white/[0.06]">
                      Open
                    </Button>
                  </Link>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
