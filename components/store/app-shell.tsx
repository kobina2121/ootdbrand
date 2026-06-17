"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Home, Menu, Search, ShoppingBag, UserRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useCart } from "@/components/store/cart-provider";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { UserLogoutButton } from "@/components/store/user-logout-button";

const navLinks = [
 { href: "/", label: "Home" },
 { href: "/products", label: "Shop" },
 { href: "/about", label: "About" },
 { href: "/custom-order", label: "Custom Order" },
 { href: "/orders", label: "Orders" },
 { href: "/cart", label: "Cart" },
];

const mobileTabs = [
 { href: "/", icon: Home, label: "Home" },
 { href: "/products", icon: Search, label: "Search" },
 { href: "/cart", icon: ShoppingBag, label: "Cart" },
 { href: "/profile", icon: UserRound, label: "Profile" },
];

type AppShellProps = {
 children: React.ReactNode;
 user: {
 name?: string | null;
 email?: string | null;
 role: "customer" | "admin";
 } | null;
};

export function AppShell({ children, user }: AppShellProps) {
 const pathname = usePathname();
 const searchParams = useSearchParams();
 const { itemCount } = useCart();
 const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
 const nextPath = searchParams.get("next") ?? "";
 const isAdminLoginView = pathname === "/login" && nextPath.startsWith("/admin");
 const isAdminUser = user?.role === "admin";
 const profileHref = user ? "/profile" : "/login?next=/profile";
 const visibleNavLinks =
 isAdminLoginView
 ? [{ href: "/", label: "Store Home" }]
 : navLinks;

 return (
 <div className="flex min-h-screen flex-col bg-[radial-gradient(circle_at_top,_#ffffff_0%,_#f7f5f1_45%,_#f1eeea_100%)] text-foreground transition-colors ">
 <header className="sticky top-0 z-50 border-b border-black/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(255,255,255,0.86))] backdrop-blur ">
 <div className="page-container flex items-center justify-between gap-3 py-3 sm:py-4">
            <Link href="/" className="shrink-0 pr-2 xl:pr-6" aria-label="tideofficial home">
 <span className="block text-[1.7rem] leading-none font-semibold tracking-[-0.04em] text-[#2f1d15] sm:text-[2rem]">
                tideofficial
 </span>
 </Link>

 <nav className="hidden min-w-0 flex-1 items-center justify-center gap-4 lg:flex xl:gap-6 2xl:gap-8">
 {visibleNavLinks.map((link) => (
 <Link
 key={link.href}
 href={link.href}
 className={`relative whitespace-nowrap text-[11px] tracking-[0.14em] uppercase transition xl:text-xs ${pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href)) ? "text-[#1f1b18] after:absolute after:-bottom-1 after:left-0 after:h-px after:w-full after:bg-[#1f1b18] " : "text-muted-foreground hover:text-foreground"}`}
 >
 {link.label}
 </Link>
 ))}
 </nav>

 <div className={`ml-auto flex shrink-0 items-center gap-1.5 lg:gap-2 ${isAdminLoginView ? "xl:hidden" : ""}`}>
 {isAdminLoginView ? (
 <div className="hidden rounded-full border border-black/15 bg-black/[0.03] px-4 py-1.5 xl:block">
 <p className="whitespace-nowrap text-[11px] tracking-[0.2em] text-[#3d3732] uppercase ">Admin Access</p>
 </div>
 ) : null}
 <div className="hidden items-center gap-2 lg:flex xl:gap-3">
 {!isAdminLoginView ? (
 <div className="flex items-center gap-0.5 lg:gap-1">
 <Link href="/products">
 <Button size="icon" variant="ghost">
 <Search className="h-4 w-4" />
 <span className="sr-only">Search</span>
 </Button>
 </Link>
 <Link href={profileHref}>
 <Button size="icon" variant="ghost">
 <UserRound className="h-4 w-4" />
 <span className="sr-only">Profile</span>
 </Button>
 </Link>
 <Link href="/cart">
 <Button size="icon" variant="ghost" className="relative">
 <ShoppingBag className="h-4 w-4" />
 {!isAdminUser ? (
 <span
 suppressHydrationWarning
 className={`absolute -right-1 -top-1 inline-flex min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] text-primary-foreground ${
 itemCount > 0 ? "opacity-100" : "opacity-0"
 }`}
 >
 {itemCount > 0 ? itemCount : ""}
 </span>
 ) : null}
 <span className="sr-only">Cart</span>
 </Button>
 </Link>
 </div>
 ) : null}
 {user ? (
 <div className="flex items-center gap-2">
 {user.role === "admin" ? (
 <Link href="/admin/products">
 <Button variant="outline" size="sm" className="h-9 rounded-full border-black/20 bg-white/90 px-3 xl:px-4">
 <span className="xl:hidden">Admin</span>
 <span className="hidden xl:inline">Admin Panel</span>
 </Button>
 </Link>
 ) : null}
 </div>
 ) : (
 <>
 <Link href="/signup" className="hidden xl:block">
 <Button size="sm">Sign Up</Button>
 </Link>
 </>
 )}
 </div>
 <div className="hidden items-center gap-0.5 sm:flex lg:hidden">
 <Link href="/products">
 <Button size="icon" variant="ghost">
 <Search className="h-4 w-4" />
 <span className="sr-only">Search</span>
 </Button>
 </Link>
 <Link href={profileHref}>
 <Button size="icon" variant="ghost">
 <UserRound className="h-4 w-4" />
 <span className="sr-only">Profile</span>
 </Button>
 </Link>
 <Link href="/cart">
 <Button size="icon" variant="ghost" className="relative">
 <ShoppingBag className="h-4 w-4" />
 {!isAdminUser ? (
 <span
 suppressHydrationWarning
 className={`absolute -right-1 -top-1 inline-flex min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] text-primary-foreground ${
 itemCount > 0 ? "opacity-100" : "opacity-0"
 }`}
 >
 {itemCount > 0 ? itemCount : ""}
 </span>
 ) : null}
 <span className="sr-only">Cart</span>
 </Button>
 </Link>
 </div>

 <Dialog open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
 <DialogTrigger className="inline-flex rounded-full border border-black/10 bg-white/80 p-2 shadow-sm lg:hidden">
 <Menu className="h-4 w-4" />
 <span className="sr-only">Open menu</span>
 </DialogTrigger>
 <DialogContent>
 <DialogHeader>
 <DialogTitle>Navigation</DialogTitle>
 </DialogHeader>
 <div className="flex flex-col gap-2">
 {visibleNavLinks.map((link) => (
 <Link key={link.href} href={link.href} onClick={() => setMobileMenuOpen(false)}>
 <Button variant="ghost" className="w-full justify-start">
 {link.label}
 </Button>
 </Link>
 ))}
 {user ? (
 <div className="space-y-2 rounded-xl border border-black/10 bg-black/[0.02] p-3 ">
 <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Signed in as</p>
 <p className="text-sm text-foreground">{user.email || user.name || "User"}</p>
 {user.role === "admin" ? (
 <Link href="/admin/products" onClick={() => setMobileMenuOpen(false)}>
 <Button variant="outline" className="w-full justify-start rounded-full border-black/20 ">
 Admin Panel
 </Button>
 </Link>
 ) : null}
 <Link href="/profile" onClick={() => setMobileMenuOpen(false)}>
 <Button variant="ghost" className="w-full justify-start rounded-full">
 Profile & Security
 </Button>
 </Link>
 <UserLogoutButton
 variant="outline"
 className="mt-2 w-full justify-start rounded-full border-black/20 "
 onDone={() => setMobileMenuOpen(false)}
 />
 </div>
 ) : (
 <>
 <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
 <Button variant="outline" className="w-full justify-start">
 Login
 </Button>
 </Link>
 <Link href="/signup" onClick={() => setMobileMenuOpen(false)}>
 <Button className="w-full justify-start">
 Sign Up
 </Button>
 </Link>
 </>
 )}
 </div>
 </DialogContent>
 </Dialog>
 </div>
 </div>
 </header>

 <main className="page-container flex flex-1 flex-col py-6 pb-24 sm:py-8 md:pb-10">{children}</main>

 <footer className="border-t border-black/10 bg-white ">
 <div className="page-container py-12 sm:py-16">
 <div className="pb-10 sm:pb-12">
 <Link href="/" aria-label="TIDE home" className="inline-flex">
 <Image
 src="/images/logo/tide-wordmark.png"
 alt="TIDE"
 width={336}
 height={96}
 className="h-16 w-auto object-contain sm:h-20 lg:h-24"
 priority={false}
 />
 </Link>
 <p className="mt-4 text-xs tracking-[0.28em] text-[#7d7771] ">
 ELEVATED WOMENSWEAR FOR EVERY STORY - MADE IN GHANA
 </p>
 </div>

 <div className="border-t border-black/10 pt-8 sm:pt-10">
 <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
 <div className="space-y-4">
 <p className="text-xs tracking-[0.24em] text-[#5f5954] ">QUICK LINKS</p>
 <div className="space-y-2 text-[#706963] ">
 <Link href="/products" className="block transition hover:translate-x-1 hover:text-[#1d1b1a] ">Shop All</Link>
 <Link href="/products?category=TOPS" className="block transition hover:translate-x-1 hover:text-[#1d1b1a] ">Tops</Link>
 <Link href="/products?category=MAXI" className="block transition hover:translate-x-1 hover:text-[#1d1b1a] ">Maxi</Link>
 <Link href="/products?category=MIDI" className="block transition hover:translate-x-1 hover:text-[#1d1b1a] ">Midi</Link>
 <Link href="/custom-order" className="block transition hover:translate-x-1 hover:text-[#1d1b1a] ">Custom Order</Link>
 </div>
 </div>

 <div className="space-y-4">
 <p className="text-xs tracking-[0.24em] text-[#5f5954] ">NEED HELP</p>
 <div className="space-y-2 text-[#706963] ">
 <a href="https://api.whatsapp.com/send/?phone=233536477207&text&type=phone_number&app_absent=0" target="_blank" rel="noreferrer" className="block transition hover:translate-x-1 hover:text-[#1d1b1a] ">+233 53 647 7207</a>
 <a href="https://api.whatsapp.com/send/?phone=233536477207&text&type=phone_number&app_absent=0" target="_blank" rel="noreferrer" className="block transition hover:translate-x-1 hover:text-[#1d1b1a] ">WhatsApp Us</a>
                <a href="https://www.instagram.com/tide/" target="_blank" rel="noreferrer" className="block transition hover:translate-x-1 hover:text-[#1d1b1a] ">Instagram DM</a>
 <Link href="/orders" className="block transition hover:translate-x-1 hover:text-[#1d1b1a] ">Track Order</Link>
 </div>
 </div>

 <div className="space-y-4">
 <p className="text-xs tracking-[0.24em] text-[#5f5954] ">OUR POLICY</p>
 <div className="space-y-2 text-[#706963] ">
 <p className="text-[1.15rem] text-[#2b2724] ">48-Hour Returns</p>
 <p className="max-w-xs leading-relaxed">
 Not satisfied? Return within 48 hours of delivery for a full refund.
 </p>
 </div>
 </div>

 <div className="space-y-4">
 <p className="text-xs tracking-[0.24em] text-[#5f5954] ">FOLLOW US</p>
 <div className="space-y-2 text-[#706963] ">
                <a href="https://www.instagram.com/tide/" target="_blank" rel="noreferrer" className="block transition hover:translate-x-1 hover:text-[#1d1b1a] ">Instagram →</a>
 <a href="https://api.whatsapp.com/send/?phone=233536477207&text&type=phone_number&app_absent=0" target="_blank" rel="noreferrer" className="block transition hover:translate-x-1 hover:text-[#1d1b1a] ">WhatsApp →</a>
                <a href="https://www.tiktok.com/@tide" target="_blank" rel="noreferrer" className="block transition hover:translate-x-1 hover:text-[#1d1b1a] ">TikTok @Tide →</a>
 </div>
 </div>
 </div>
 </div>

 <div className="mt-10 flex flex-col gap-2 border-t border-black/10 pt-6 text-sm text-[#8a847e] sm:flex-row sm:items-center sm:justify-between">
              <p>© <span suppressHydrationWarning>{new Date().getFullYear()}</span> Tide. All rights reserved.</p>
 <p>Designed in Ghana. Built for comfort.</p>
 </div>
 </div>
 </footer>

 <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-black/10 bg-background/95 backdrop-blur md:hidden">
 <ul className="mx-auto grid w-full max-w-md grid-cols-4">
 {mobileTabs.map((tab) => {
 const Icon = tab.icon;
 const active = pathname === tab.href || (tab.href !== "/" && pathname.startsWith(tab.href));
 return (
 <li key={tab.href}>
 <Link
 href={tab.href}
 className={`flex flex-col items-center gap-1 py-2 text-[11px] ${active ? "text-foreground" : "text-muted-foreground"}`}
 >
 <span className={`rounded-full p-1 ${active ? "bg-black/10 " : ""}`}>
 <Icon className="size-4" />
 </span>
 {tab.label}
 </Link>
 </li>
 );
 })}
 </ul>
 </nav>
 </div>
 );
}
