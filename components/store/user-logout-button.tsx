"use client";

import { useState } from "react";
import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";

import { Button } from "@/components/ui/button";

type UserLogoutButtonProps = {
  onDone?: () => void;
  className?: string;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
};

export function UserLogoutButton({ onDone, className, variant = "outline" }: UserLogoutButtonProps) {
  const [isPending, setIsPending] = useState(false);

  const handleLogout = async () => {
    setIsPending(true);

    await signOut({
      callbackUrl: "/",
    });

    onDone?.();
  };

  return (
    <Button
      type="button"
      variant={variant}
      className={className}
      onClick={handleLogout}
      disabled={isPending}
    >
      <LogOut className="mr-2 size-4" />
      {isPending ? "Logging out..." : "Logout"}
    </Button>
  );
}
