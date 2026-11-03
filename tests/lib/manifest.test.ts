import { existsSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import manifest from "@/app/manifest";

describe("web app manifest", () => {
  const appManifest = manifest();

  it("opens the installed app without browser bars", () => {
    expect(appManifest.display).toBe("standalone");
    expect(appManifest.start_url).toBe("/");
    expect(appManifest.scope).toBe("/");
  });

  it.each(["192x192", "512x512"])("includes the %s PNG icon that Android requires", (size) => {
    const icon = appManifest.icons?.find((entry) => entry.sizes === size && entry.type === "image/png");

    expect(icon).toBeDefined();
  });

  it("only lists icon files that exist", () => {
    appManifest.icons?.forEach((icon) => {
      const isGeneratedByApp = icon.src === "/favicon.ico";
      const location = isGeneratedByApp ? join(process.cwd(), "app", icon.src) : join(process.cwd(), "public", icon.src);

      expect(existsSync(location), icon.src).toBe(true);
    });
  });
});
