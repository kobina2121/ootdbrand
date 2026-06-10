"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BellRing, House, Package, Ruler, ShoppingBag } from "lucide-react";

import { cn } from "@/lib/utils";

const links = [
 { href: "/admin/products", label: "Products", icon: Package },
 { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
 { href: "/admin/custom-orders", label: "Custom Orders", icon: Ruler },
 { href: "/admin/notifications", label: "Notifications", icon: BellRing },
 { href: "/", label: "Back to Store", icon: House },
];

export function AdminSidebar() {
 const pathname = usePathname();

 return (
 <aside className="h-fit w-full rounded-2xl border border-black/10 bg-white/80 p-4 shadow-sm backdrop-blur transition-colors md:sticky md:top-6 md:w-64">
 <div className="mb-4 border-b border-black/10 pb-4 ">
 <p className="text-[0.7rem] uppercase tracking-[0.22em] text-muted-foreground">Admin space</p>
 <h2 className="text-xl font-semibold tracking-tight">Control Panel</h2>
 </div>

 <nav className="flex flex-col gap-2">
 {links.map((link) => {
 const isActive = pathname.startsWith(link.href) && link.href !== "/";
 const Icon = link.icon;

 return (
 <Link
 key={link.href}
 href={link.href}
 className={cn(
 "flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition-colors",
 isActive
 ? "bg-black text-white shadow-sm "
 : "text-foreground hover:bg-muted ",
 )}
 >
 <Icon className="size-4" />
 <span>{link.label}</span>
 </Link>
 );
 })}
 </nav>
 </aside>
 );
}
