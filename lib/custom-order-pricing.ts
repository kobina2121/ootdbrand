export function resolveCustomOrderCustomizationFeeGhs() {
  const raw =
    process.env.CUSTOM_ORDER_CUSTOMIZATION_FEE_GHS ??
    process.env.NEXT_PUBLIC_CUSTOM_ORDER_CUSTOMIZATION_FEE_GHS ??
    "0";

  const parsed = Number.parseFloat(raw);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return 0;
  }

  return Math.round(parsed * 100) / 100;
}

export function calculateCustomOrderTotal(basePriceGhs: number, customizationFeeGhs: number) {
  const safeBase = Number.isFinite(basePriceGhs) && basePriceGhs > 0 ? basePriceGhs : 0;
  const safeFee = Number.isFinite(customizationFeeGhs) && customizationFeeGhs > 0 ? customizationFeeGhs : 0;
  return Math.round((safeBase + safeFee) * 100) / 100;
}
