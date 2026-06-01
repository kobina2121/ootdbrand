import { NextResponse } from "next/server";

import { failure, success } from "@/lib/api-response";
import { resolveCustomOrderCustomizationFeeGhs } from "@/lib/custom-order-pricing";
import { listProducts } from "@/lib/services/product-service";

export async function GET() {
  try {
    const products = await listProducts({ activeOnly: true, sort: "latest" });
    const customizationFee = resolveCustomOrderCustomizationFeeGhs();

    const catalog = products.map((product) => ({
      slug: product.slug,
      name: product.name,
      category: product.category,
      description: product.description,
      basePrice: product.basePrice,
      image: product.image,
      variants: product.variants.map((variant) => ({
        sku: variant.sku,
        size: variant.size,
        color: variant.color,
        colorCode: variant.colorCode ?? "#9CA3AF",
        image: variant.image ?? "",
        price: variant.priceOverride ?? product.basePrice,
        stock: variant.stock,
      })),
    }));

    return NextResponse.json(
      success("Custom catalog fetched", {
        products: catalog,
        customizationFee,
      }),
    );
  } catch {
    return NextResponse.json(failure("Could not fetch custom catalog"), { status: 500 });
  }
}
