import { NextResponse } from "next/server";

import { requireAdminUser } from "@/lib/auth/guards";
import { failure, success } from "@/lib/api-response";
import { checkRateLimit, isJsonRequest, isTrustedOrigin } from "@/lib/security/guards";
import { createProduct, listProducts } from "@/lib/services/product-service";
import { adminProductSchema } from "@/lib/validators/admin";

function resolveProductWriteError(error: unknown) {
  if (error instanceof Error && error.name === "ValidationError") {
    return { message: `Validation failed: ${error.message}`, status: 400 };
  }

  if (error instanceof Error && "code" in error && Number((error as { code?: unknown }).code) === 11000) {
    const duplicateKey = String(
      ((error as { keyPattern?: Record<string, unknown> }).keyPattern &&
        Object.keys((error as { keyPattern?: Record<string, unknown> }).keyPattern ?? {})[0]) ||
        "",
    );

    if (duplicateKey.includes("slug")) {
      return { message: "Product slug already exists. Use a different slug.", status: 409 };
    }

    if (duplicateKey.includes("variants.sku")) {
      return { message: "A variant SKU already exists. Ensure each SKU is unique.", status: 409 };
    }

    return { message: "Duplicate product data detected. Please use unique values.", status: 409 };
  }

  if (error instanceof Error) {
    if (error.message.includes("MONGODB_URI")) {
      return { message: "Database is not configured. Check MONGODB_URI.", status: 500 };
    }

    return { message: `Could not create product: ${error.message}`, status: 500 };
  }

  return { message: "Could not create product", status: 500 };
}

export async function GET() {
  const admin = await requireAdminUser();

  if (!admin) {
    return NextResponse.json(failure("Unauthorized"), { status: 403 });
  }

  try {
    const products = await listProducts();
    return NextResponse.json(success("Products fetched", { products }));
  } catch {
    return NextResponse.json(failure("Could not fetch products"), { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!isTrustedOrigin(request)) {
    return NextResponse.json(failure("Invalid request origin."), { status: 403 });
  }

  if (!isJsonRequest(request)) {
    return NextResponse.json(failure("Unsupported content type."), { status: 415 });
  }

  const rateLimit = checkRateLimit(request, {
    bucket: "admin:products:create",
    limit: 30,
    windowMs: 10 * 60 * 1000,
  });
  if (!rateLimit.ok) {
    return NextResponse.json(failure("Too many product create requests. Please retry shortly."), {
      status: 429,
      headers: { "Retry-After": String(rateLimit.retryAfterSeconds) },
    });
  }

  const admin = await requireAdminUser();

  if (!admin) {
    return NextResponse.json(failure("Unauthorized"), { status: 403 });
  }

  try {
    const json = await request.json();
    const parsed = adminProductSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(failure("Invalid product payload"), { status: 400 });
    }

    const created = await createProduct(parsed.data);

    return NextResponse.json(success("Product created", created), { status: 201 });
  } catch (error) {
    console.error("[admin.products.create] Failed to create product", error);
    const { message, status } = resolveProductWriteError(error);
    return NextResponse.json(failure(message), { status });
  }
}
