"use client";

import { LaptopMinimal, MoonStar, SunMedium } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const themeOptions = [
  {
    value: "light" as const,
    label: "Light",
    description: "Bright surfaces for daytime browsing.",
    icon: SunMedium,
  },
  {
    value: "dark" as const,
    label: "Dark",
    description: "A calmer look for low-light sessions.",
    icon: MoonStar,
  },
  {
    value: "system" as const,
    label: "System",
    description: "Match your device preference automatically.",
    icon: LaptopMinimal,
  },
];

export function ThemePreferenceCard() {
  const { setTheme, theme, resolvedTheme } = useTheme();

  return (
    <Card className="rounded-3xl border-black/10 bg-white/90 shadow-sm dark:border-white/10 dark:bg-[#181513]/90">
      <CardHeader className="space-y-2 border-b border-black/10 dark:border-white/10">
        <p className="text-xs tracking-[0.24em] text-muted-foreground">APPEARANCE</p>
        <CardTitle className="font-heading text-4xl leading-none text-[#1f1b18] dark:text-white">
          Theme
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Choose how your account area looks on this device.
        </p>
      </CardHeader>
      <CardContent className="space-y-4 pt-6">
        <div className="grid gap-3 sm:grid-cols-3">
          {themeOptions.map((option) => {
            const isSelected = theme === option.value;
            const Icon = option.icon;

            return (
              <Button
                key={option.value}
                type="button"
                variant={isSelected ? "default" : "outline"}
                className={`h-auto min-h-28 flex-col items-start rounded-2xl px-4 py-4 text-left ${
                  isSelected
                    ? "border-transparent bg-primary text-primary-foreground hover:bg-primary/90"
                    : "border-black/10 bg-white/80 hover:bg-black/[0.04] dark:border-white/10 dark:bg-white/[0.03] dark:hover:bg-white/[0.06]"
                }`}
                onClick={() => setTheme(option.value)}
              >
                <div className="flex w-full items-center justify-between">
                  <Icon className="size-4" />
                  {isSelected ? (
                    <span className="rounded-full bg-white/15 px-2 py-0.5 text-[10px] uppercase tracking-[0.18em]">
                      Active
                    </span>
                  ) : null}
                </div>
                <div className="mt-4 space-y-1">
                  <p className="text-sm font-semibold uppercase tracking-[0.12em]">{option.label}</p>
                  <p className="text-xs leading-5 opacity-80">{option.description}</p>
                </div>
              </Button>
            );
          })}
        </div>
        <div className="rounded-2xl border border-black/10 bg-[#faf9f7] px-4 py-3 text-sm text-[#5b554f] dark:border-white/10 dark:bg-white/[0.04] dark:text-[#d4cbc2]">
          <p>
            Current display mode:{" "}
            <span className="font-semibold capitalize text-[#1f1b18] dark:text-white">
              {theme === "system" ? `${resolvedTheme ?? "light"} (system)` : theme ?? "light"}
            </span>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
