import type { CartItem } from "@/lib/products";

type DiscountRule = {
  code: string;
  minimumSubtotal?: number;
} & (
  | {
      type: "fixed";
      value: number;
    }
  | {
      type: "percentage";
      value: number;
    }
);

export type DiscountResolution = {
  requestedCode: string | null;
  appliedCode: string | null;
  amount: number;
  message: string | null;
};

const DISCOUNT_CONFIG_ENV = "STORE_DISCOUNT_CODES";
const DEFAULT_DISCOUNT_RULES: DiscountRule[] = [];

export function normalizeDiscountCode(code?: string | null) {
  const normalized = code?.trim().toUpperCase() ?? "";
  return normalized.length > 0 ? normalized : null;
}

function isDiscountRule(value: unknown): value is DiscountRule {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  const type = candidate.type;
  const minimumSubtotal = candidate.minimumSubtotal;

  if (typeof candidate.code !== "string" || typeof candidate.value !== "number") {
    return false;
  }

  if (type !== "fixed" && type !== "percentage") {
    return false;
  }

  if (typeof minimumSubtotal !== "undefined" && typeof minimumSubtotal !== "number") {
    return false;
  }

  return true;
}

function loadDiscountRules() {
  const raw = process.env[DISCOUNT_CONFIG_ENV];

  if (!raw) {
    return DEFAULT_DISCOUNT_RULES;
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error(`Invalid ${DISCOUNT_CONFIG_ENV} JSON configuration.`);
  }

  if (!Array.isArray(parsed) || !parsed.every(isDiscountRule)) {
    throw new Error(`Invalid ${DISCOUNT_CONFIG_ENV} entries.`);
  }

  return parsed.map((rule) => ({
    ...rule,
    code: normalizeDiscountCode(rule.code) ?? rule.code,
  }));
}

function calculateSubtotal(items: CartItem[]) {
  return items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
}

export function resolveDiscount(items: CartItem[], code?: string | null): DiscountResolution {
  const requestedCode = normalizeDiscountCode(code);

  if (!requestedCode) {
    return {
      requestedCode: null,
      appliedCode: null,
      amount: 0,
      message: null,
    };
  }

  const rule = loadDiscountRules().find((entry) => entry.code === requestedCode);

  if (!rule) {
    return {
      requestedCode,
      appliedCode: null,
      amount: 0,
      message: "Coupon code is invalid or inactive.",
    };
  }

  const subtotal = calculateSubtotal(items);

  if (rule.minimumSubtotal && subtotal < rule.minimumSubtotal) {
    return {
      requestedCode,
      appliedCode: null,
      amount: 0,
      message: `Coupon requires a minimum order of ${rule.minimumSubtotal} GHS.`,
    };
  }

  const rawAmount =
    rule.type === "fixed" ? rule.value : Math.floor((subtotal * rule.value) / 100);
  const amount = Math.max(0, Math.min(rawAmount, subtotal));

  if (amount <= 0) {
    return {
      requestedCode,
      appliedCode: null,
      amount: 0,
      message: "Coupon is not applicable to this cart.",
    };
  }

  return {
    requestedCode,
    appliedCode: requestedCode,
    amount,
    message: null,
  };
}
