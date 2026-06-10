"use client";

import { FormEvent, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { CreditCard, MapPin, Smartphone } from "lucide-react";

import { useCart } from "@/components/store/cart-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatPriceNgn } from "@/lib/products";
import { checkoutInitSchema } from "@/lib/validators/checkout";

export default function CheckoutPage() {
 const { items, subtotal, transactionFee, total, userRole } = useCart();
 const isClientReady = useSyncExternalStore(
 () => () => {},
 () => true,
 () => false,
 );
 const [paymentMethod, setPaymentMethod] = useState<"card" | "mobile_money">("card");
 const [isSubmitting, setIsSubmitting] = useState(false);
 const [errorMessage, setErrorMessage] = useState<string | null>(null);
 const router = useRouter();

 if (!isClientReady) {
 return (
 <Card className="mx-auto w-full max-w-2xl rounded-3xl border-black/10 bg-white/90 text-center shadow-sm ">
 <CardHeader>
 <CardTitle className="font-heading text-5xl leading-none ">Loading checkout</CardTitle>
 </CardHeader>
 <CardContent>
 <p className="text-sm text-muted-foreground">Preparing your cart...</p>
 </CardContent>
 </Card>
 );
 }

 if (userRole === "admin") {
 return (
 <Card className="mx-auto w-full max-w-2xl rounded-3xl border-black/10 bg-white/90 text-center shadow-sm ">
 <CardHeader>
 <CardTitle className="font-heading text-5xl leading-none ">Checkout Disabled for Admin</CardTitle>
 </CardHeader>
 <CardContent className="space-y-3">
 <p className="text-sm text-muted-foreground">Admin accounts cannot complete customer checkout.</p>
 <Button className="rounded-full" onClick={() => window.location.assign("/admin/products")}>
 Go to Admin Dashboard
 </Button>
 </CardContent>
 </Card>
 );
 }

 if (items.length === 0) {
 return (
 <Card className="mx-auto w-full max-w-2xl rounded-3xl border-black/10 bg-white/90 text-center shadow-sm ">
 <CardHeader>
 <CardTitle className="font-heading text-5xl leading-none ">No items to checkout</CardTitle>
 </CardHeader>
 <CardContent>
 <p className="text-sm text-muted-foreground">Your cart is empty. Add products before checkout.</p>
 </CardContent>
 </Card>
 );
 }

 const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
 event.preventDefault();
 setErrorMessage(null);

 const formData = new FormData(event.currentTarget);
 const addressLine = String(formData.get("addressLine") ?? "").trim();
 const city = String(formData.get("city") ?? "").trim();
 const stateRegion = String(formData.get("stateRegion") ?? "").trim();
 const country = String(formData.get("country") ?? "").trim();

 const payload = {
 fullName: String(formData.get("fullName") ?? ""),
 email: String(formData.get("email") ?? ""),
 phone: String(formData.get("phone") ?? ""),
 address: [addressLine, city, stateRegion, country].filter(Boolean).join(", "),
 paymentMethod,
 items,
 };

 const parsed = checkoutInitSchema.safeParse(payload);

 if (!parsed.success) {
 setErrorMessage("Please complete all required fields with valid details.");
 return;
 }

 setIsSubmitting(true);

 try {
 const response = await fetch("/api/checkout/init", {
 method: "POST",
 headers: {
 "Content-Type": "application/json",
 },
 body: JSON.stringify(parsed.data),
 });

 const json = (await response.json()) as {
 ok: boolean;
 message: string;
 data: { authorizationUrl?: string };
 };

 if (!json.ok || !json.data.authorizationUrl) {
 setErrorMessage(json.message || "Could not initialize checkout.");
 return;
 }

 if (json.data.authorizationUrl.startsWith("http")) {
 window.location.assign(json.data.authorizationUrl);
 } else {
 router.push(json.data.authorizationUrl);
 }
 } catch {
 setErrorMessage("Checkout failed. Please try again.");
 } finally {
 setIsSubmitting(false);
 }
 };

 return (
 <div className="space-y-6">
 <section className="rounded-3xl border border-black/10 bg-[linear-gradient(135deg,#f7f5f1_0%,#f0ece6_100%)] p-5 shadow-sm sm:p-7">
 <h1 className="font-heading text-5xl leading-none text-[#1f1b18] sm:text-6xl">Checkout</h1>
 <p className="section-subtitle mt-2">Complete your details and continue to secure payment.</p>
 </section>

 <form className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]" onSubmit={onSubmit}>
 <Card className="rounded-2xl border-black/10 bg-white/90 shadow-sm ">
 <CardHeader className="border-b border-black/10 pb-4 ">
 <div className="inline-flex items-center gap-2 text-[#1f1b18] ">
 <MapPin className="size-4" />
 <p className="form-section-title">Shipping Information</p>
 </div>
 <p className="text-sm text-[#6e6761] ">Use the same format as your delivery address for fast dispatch.</p>
 </CardHeader>
 <CardContent className="space-y-4">
 <Input name="fullName" placeholder="Full name" required className="rounded-xl border-black/15 " />
 <Input name="email" placeholder="Email" type="email" required className="rounded-xl border-black/15 " />
 <Input name="phone" placeholder="Phone" required className="rounded-xl border-black/15 " />
 <div className="space-y-3 rounded-xl border border-black/10 bg-[#f7f5f1]/70 p-3 sm:p-4">
 <p className="form-section-title">Delivery Address</p>
 <Input
 name="addressLine"
 placeholder="Street address / House number"
 required
 className="rounded-xl border-black/15 "
 />
 <div className="grid gap-3 sm:grid-cols-2">
 <Input name="city" placeholder="City" required className="rounded-xl border-black/15 " />
 <Input name="stateRegion" placeholder="State / Region" required className="rounded-xl border-black/15 " />
 </div>
 <Input name="country" placeholder="Country" defaultValue="Ghana" required className="rounded-xl border-black/15 " />
 </div>
 <div className="space-y-3 rounded-xl border border-black/10 bg-[#f7f5f1]/70 p-3 sm:p-4">
 <p className="form-section-title">Payment Method</p>
 <div className="grid gap-2 sm:grid-cols-2">
 <button
 type="button"
 onClick={() => setPaymentMethod("card")}
 className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm transition ${
 paymentMethod === "card"
 ? "border-black bg-black text-white "
 : "border-black/20 bg-white text-[#1f1b18] hover:border-black/50 "
 }`}
 >
 <CreditCard className="size-4" />
 Visa Card
 </button>
 <button
 type="button"
 onClick={() => setPaymentMethod("mobile_money")}
 className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm transition ${
 paymentMethod === "mobile_money"
 ? "border-black bg-black text-white "
 : "border-black/20 bg-white text-[#1f1b18] hover:border-black/50 "
 }`}
 >
 <Smartphone className="size-4" />
 Mobile Money
 </button>
 </div>
 </div>
 {errorMessage ? <p className="text-sm text-destructive">{errorMessage}</p> : null}
 </CardContent>
 </Card>

 <Card className="rounded-2xl border-black/10 bg-white/90 shadow-sm xl:sticky xl:top-24">
 <CardHeader>
 <div className="inline-flex items-center gap-2 ">
 <CreditCard className="size-4" />
 <CardTitle>Order Summary</CardTitle>
 </div>
 </CardHeader>
 <CardContent className="space-y-4">
 <p className="text-sm text-muted-foreground">{items.length} item(s) in cart</p>
 <div className="flex items-center justify-between text-sm ">
 <span>Subtotal</span>
 <span>{formatPriceNgn(subtotal)}</span>
 </div>
 <div className="flex items-center justify-between text-sm ">
 <span>Transaction fee</span>
 <span>{formatPriceNgn(transactionFee)}</span>
 </div>
 <div className="flex items-center justify-between font-semibold ">
 <span>Total</span>
 <span>{formatPriceNgn(total)}</span>
 </div>
 <p className="text-xs text-muted-foreground">Secure checkout via Paystack ({paymentMethod === "card" ? "Visa Card" : "Mobile Money"}).</p>
 <Button className="w-full rounded-full" type="submit" disabled={isSubmitting}>
 {isSubmitting ? "Initializing..." : paymentMethod === "card" ? "Pay with Visa Card" : "Pay with Mobile Money"}
 </Button>
 </CardContent>
 </Card>
 </form>
 </div>
 );
}
