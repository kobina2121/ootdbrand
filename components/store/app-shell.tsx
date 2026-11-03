"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useState, useSyncExternalStore } from "react";
import { Home, Menu, Search, ShoppingBag, UserRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useCart } from "@/components/store/cart-provider";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { UserLogoutButton } from "@/components/store/user-logout-button";
import { socialLinks } from "@/lib/social-links";

const navLinks = [
 { href: "/", label: "Home" },
 { href: "/products", label: "Shop" },
 { href: "/combo", label: "Build a Combo" },
 { href: "/about", label: "About" },
 { href: "/custom-order", label: "Custom Order" },
 { href: "/orders", label: "Track Order" },
 { href: "/cart", label: "Cart" },
];

const mobileTabs = [
 { href: "/", icon: Home, label: "Home" },
 { href: "/products", icon: Search, label: "Shop" },
 { href: "/cart", icon: ShoppingBag, label: "Cart" },
 { href: "/profile", icon: UserRound, label: "Profile" },
];

function CartCountBadge({ count }: { count: number }) {
 if (count <= 0) {
 return null;
 }

 return (
 <span
 suppressHydrationWarning
 className="absolute -right-1 -top-1 inline-flex min-h-4 min-w-4 items-center justify-center rounded-full bg-[#c2185b] px-1 text-[10px] font-semibold leading-none text-white shadow-sm"
 >
 {count > 99 ? "99+" : count}
 </span>
 );
}

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
 const isHydrated = useSyncExternalStore(
 () => () => {},
 () => true,
 () => false,
 );
 const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
 const nextPath = searchParams.get("next") ?? "";
 const isAdminLoginView = pathname === "/login" && nextPath.startsWith("/admin");
 const isAdminUser = user?.role === "admin";
 const visibleItemCount = isHydrated ? itemCount : 0;
 const profileHref = user ? "/profile" : "/login";
 const visibleNavLinks =
 isAdminLoginView
 ? [{ href: "/", label: "Store Home" }]
 : navLinks;

 return (
 <div className="storefront flex min-h-screen flex-col bg-[#f6f2ea] text-foreground transition-colors ">
 <header className="sticky top-0 z-50 border-b border-[#1d1b1a] bg-[#f6f2ea]/95 backdrop-blur ">
	 <div className="page-container flex items-center justify-between gap-2 py-2.5 sm:gap-3 lg:grid lg:grid-cols-[1fr_auto_1fr] lg:py-2">
 <p className="hidden text-[11px] tracking-[0.22em] text-[#5f5954] uppercase lg:block">Made in Ghana</p>
	            <Link href="/" className="flex min-h-11 shrink-0 items-center pr-2 lg:pr-0" aria-label="theootd.brand home">
	 <span className="block font-heading text-[1.75rem] leading-none font-medium italic tracking-[-0.02em] text-[#1d1b1a] sm:text-[2.4rem]">
	                theootd.brand
	 </span>
	 </Link>

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
 <span className="sr-only">Shop</span>
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
 {!isAdminUser ? <CartCountBadge count={visibleItemCount} /> : null}
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
 <Button size="sm" className="rounded-none">Sign Up</Button>
 </Link>
 </>
 )}
 </div>
 <div className="hidden items-center gap-0.5 sm:flex lg:hidden">
 <Link href="/products">
 <Button size="icon" variant="ghost">
 <Search className="h-4 w-4" />
 <span className="sr-only">Shop</span>
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
 {!isAdminUser ? <CartCountBadge count={visibleItemCount} /> : null}
 <span className="sr-only">Cart</span>
 </Button>
 </Link>
 </div>

 <Dialog open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
 <DialogTrigger className="inline-flex size-11 items-center justify-center border border-[#1d1b1a]/30 lg:hidden">
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
 <nav className="hidden border-t border-[#1d1b1a]/15 lg:block">
 <div className="page-container flex items-center justify-center gap-6 xl:gap-10">
 {visibleNavLinks.map((link) => (
 <Link
 key={link.href}
 href={link.href}
 className={`relative flex min-h-10 items-center whitespace-nowrap text-[11px] tracking-[0.18em] uppercase transition xl:text-xs ${pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href)) ? "text-[#1d1b1a] after:absolute after:bottom-1.5 after:left-0 after:h-px after:w-full after:bg-[#c2185b] " : "text-[#5f5954] hover:text-[#1d1b1a]"}`}
 >
 {link.label}
 </Link>
 ))}
 </div>
 </nav>
 </header>

	 <main className="page-container flex flex-1 flex-col py-5 pb-[calc(6.5rem+env(safe-area-inset-bottom))] sm:py-8 md:pb-16">{children}</main>

 <footer className="bg-[#1d1b1a] pb-[calc(3.5rem+env(safe-area-inset-bottom))] text-[#f6f2ea] md:pb-0">
 <div className="page-container py-12 sm:py-16">
 <div className="pb-10 sm:pb-12">
 <Link href="/" aria-label="theootd.brand home" className="block">
 <span className="block font-heading text-[clamp(3.25rem,14.5vw,14rem)] leading-[0.9] font-medium italic tracking-[-0.03em] text-[#f6f2ea]">
 theootd.brand
 </span>
 </Link>
 <p className="mt-4 text-xs tracking-[0.28em] text-[#b9b1a6] ">
 ELEVATED WOMENSWEAR FOR EVERY STORY - MADE IN GHANA
 </p>
 </div>

 <div className="border-t border-white/20 pt-8 sm:pt-10">
 <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
 <div className="space-y-4">
 <p className="text-xs tracking-[0.24em] text-[#f48fb1] ">QUICK LINKS</p>
 <div className="space-y-2 text-[#d9d2c7] ">
 <Link href="/products" className="flex min-h-11 items-center transition hover:translate-x-1 hover:text-white ">Shop All</Link>
 <Link href="/products?category=TOPS" className="flex min-h-11 items-center transition hover:translate-x-1 hover:text-white ">Tops</Link>
 <Link href="/products?category=SKIRTS" className="flex min-h-11 items-center transition hover:translate-x-1 hover:text-white ">Skirts</Link>
 <Link href="/products?category=PANTS" className="flex min-h-11 items-center transition hover:translate-x-1 hover:text-white ">Pants</Link>
 <Link href="/products?category=CAPRIS" className="flex min-h-11 items-center transition hover:translate-x-1 hover:text-white ">Capris</Link>
 <Link href="/products?category=MAXI" className="flex min-h-11 items-center transition hover:translate-x-1 hover:text-white ">Maxi</Link>
 <Link href="/products?category=MIDI" className="flex min-h-11 items-center transition hover:translate-x-1 hover:text-white ">Midi</Link>
 <Link href="/combo" className="flex min-h-11 items-center transition hover:translate-x-1 hover:text-white ">Build a Combo</Link>
 <Link href="/custom-order" className="flex min-h-11 items-center transition hover:translate-x-1 hover:text-white ">Custom Order</Link>
 </div>
 </div>

 <div className="space-y-4">
 <p className="text-xs tracking-[0.24em] text-[#f48fb1] ">NEED HELP</p>
 <div className="space-y-2 text-[#d9d2c7] ">
 <a href={socialLinks.whatsapp} target="_blank" rel="noreferrer" className="flex min-h-11 items-center transition hover:translate-x-1 hover:text-white ">+233 53 647 7207</a>
 <a href={socialLinks.whatsapp} target="_blank" rel="noreferrer" className="flex min-h-11 items-center transition hover:translate-x-1 hover:text-white ">WhatsApp Us</a>
                <a href={socialLinks.instagram} target="_blank" rel="noreferrer" className="flex min-h-11 items-center transition hover:translate-x-1 hover:text-white ">Instagram DM</a>
 <Link href="/orders" className="flex min-h-11 items-center transition hover:translate-x-1 hover:text-white ">Track Order</Link>
 </div>
 </div>

 <div className="space-y-4">
 <p className="text-xs tracking-[0.24em] text-[#f48fb1] ">OUR POLICY</p>
 <div className="space-y-2 text-[#d9d2c7] ">
 <p className="text-[1.15rem] text-white ">48-Hour Returns</p>
 <p className="max-w-xs leading-relaxed">
 Not satisfied? Return within 48 hours of delivery for a full refund.
 </p>
 </div>
 </div>

 <div className="space-y-4">
 <p className="text-xs tracking-[0.24em] text-[#f48fb1] ">FOLLOW US</p>
 <div className="space-y-2 text-[#d9d2c7] ">
                <a href={socialLinks.instagram} target="_blank" rel="noreferrer" className="flex min-h-11 items-center transition hover:translate-x-1 hover:text-white ">Instagram →</a>
 <a href={socialLinks.whatsapp} target="_blank" rel="noreferrer" className="flex min-h-11 items-center transition hover:translate-x-1 hover:text-white ">WhatsApp →</a>
                <a href={socialLinks.tiktok} target="_blank" rel="noreferrer" className="flex min-h-11 items-center transition hover:translate-x-1 hover:text-white ">TikTok @theootd.brand →</a>
 </div>
 </div>
 </div>
 </div>

 <div className="mt-10 grid gap-2 border-t border-white/20 pt-6 text-center text-sm text-[#b9b1a6] sm:grid-cols-3 sm:items-center sm:text-left">
              <p>© <span suppressHydrationWarning>{new Date().getFullYear()}</span> theootd.brand. All rights reserved.</p>
 <div className="space-y-2 sm:text-center">
 <p>
 A Loo<span className="text-[#f06a9b]">prompt</span> Product
 </p>
 <Image
 src="/images/logo/looprompt-mark.png"
 alt="Looprompt mark"
 width={28}
 height={31}
 className="mx-auto rounded-full bg-[#f6f2ea] p-1"
 />
 </div>
 <p className="sm:text-right">Designed in Ghana. Built for comfort.</p>
 </div>
 </div>
 </footer>

	 <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-[#1d1b1a] bg-[#f6f2ea]/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
 <ul className="mx-auto grid w-full max-w-md grid-cols-4">
 {mobileTabs.map((tab) => {
 const Icon = tab.icon;
 const active = pathname === tab.href || (tab.href !== "/" && pathname.startsWith(tab.href));
 return (
 <li key={tab.href}>
 <Link
 href={tab.href}
 aria-label={tab.href === "/cart" && !isAdminUser && visibleItemCount > 0 ? `Cart, ${visibleItemCount} item${visibleItemCount === 1 ? "" : "s"}` : tab.label}
 className={`flex min-h-14 flex-col items-center justify-center gap-1 py-2 text-[11px] ${active ? "text-foreground" : "text-muted-foreground"}`}
 >
 <span className={`relative p-1 ${active ? "border-b border-[#c2185b] " : ""}`}>
 <Icon className="size-4" />
 {tab.href === "/cart" && !isAdminUser ? <CartCountBadge count={visibleItemCount} /> : null}
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
