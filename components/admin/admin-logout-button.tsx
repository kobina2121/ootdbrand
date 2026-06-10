"use client";

import { useState } from "react";
import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";

import { Button } from "@/components/ui/button";

export function AdminLogoutButton() {
 const [isPending, setIsPending] = useState(false);

 const handleSignOut = async () => {
 setIsPending(true);

 await signOut({
 callbackUrl: "/",
 });
 };

 return (
 <Button
 variant="outline"
 size="sm"
 className="rounded-full border-black/20 bg-white transition-colors "
 onClick={handleSignOut}
 disabled={isPending}
 >
 <LogOut className="mr-2 size-4" />
 {isPending ? "Logging out..." : "Logout"}
 </Button>
 );
}
