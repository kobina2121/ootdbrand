"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

type ClickableContainerProps = {
  href: string;
  as?: "article" | "tr";
  className?: string;
  children: React.ReactNode;
};

function isInteractiveTarget(target: EventTarget | null) {
  if (!(target instanceof Element)) {
    return false;
  }

  return Boolean(
    target.closest(
      'a, button, input, select, textarea, summary, [role="button"], [data-no-card-click="true"]',
    ),
  );
}

export function ClickableContainer({
  href,
  as = "article",
  className,
  children,
}: ClickableContainerProps) {
  const router = useRouter();

  const open = React.useCallback(() => {
    router.push(href);
  }, [href, router]);

  const handleClick = React.useCallback(
    (event: React.MouseEvent<HTMLElement>) => {
      if (isInteractiveTarget(event.target)) {
        return;
      }

      open();
    },
    [open],
  );

  const handleKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLElement>) => {
      if (isInteractiveTarget(event.target)) {
        return;
      }

      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        open();
      }
    },
    [open],
  );

  if (as === "tr") {
    return (
      <TableRow
        className={cn("cursor-pointer focus-within:bg-muted/50", className)}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        title="Open order details"
      >
        {children}
      </TableRow>
    );
  }

  return (
    <article
      className={cn("cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-black/30", className)}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      title="Open order details"
    >
      {children}
    </article>
  );
}
