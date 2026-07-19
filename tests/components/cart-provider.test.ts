import { describe, expect, it } from "vitest";

import { getCartStorageKey } from "@/components/store/cart-provider";

describe("cart storage isolation", () => {
  it("uses separate storage keys for guests and each signed-in user", () => {
    expect(getCartStorageKey(null)).toBe("threadline.cart.v2.guest");
    expect(getCartStorageKey("user-a")).toBe("threadline.cart.v2.user.user-a");
    expect(getCartStorageKey("user-b")).toBe("threadline.cart.v2.user.user-b");
    expect(getCartStorageKey("user-a")).not.toBe(getCartStorageKey("user-b"));
  });
});
