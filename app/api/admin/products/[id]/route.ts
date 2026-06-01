import { NextResponse } from "next/server";

import { requireAdminUser } from "@/lib/auth/guards";
import { failure, success } from "@/lib/api-response";
import { checkRateLimit, isJsonRequest, isTrustedOrigin } from "@/lib/security/guards";
import { deleteProductById, getProductById, updateProductById } from "@/lib/services/product-service";
import { adminProductUpdateSchema } from "@/lib/validators/admin";

type RouteContext = {
  params: Promise<{ id: string }>;
};

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

    return { message: `Could not update product: ${error.message}`, status: 500 };
  }

  return { message: "Could not update product", status: 500 };
}

export async function GET(_: Request, context: RouteContext) {
  const admin = await requireAdminUser();

  if (!admin) {
    return NextResponse.json(failure("Unauthorized"), { status: 403 });
  }

  const { id } = await context.params;

  try {
    const product = await getProductById(id);

    if (!product) {
      return NextResponse.json(failure("Product not found"), { status: 404 });
    }

    return NextResponse.json(success("Product fetched", { product }));
  } catch {
    return NextResponse.json(failure("Could not fetch product"), { status: 500 });
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  if (!isTrustedOrigin(request)) {
    return NextResponse.json(failure("Invalid request origin."), { status: 403 });
  }

  if (!isJsonRequest(request)) {
    return NextResponse.json(failure("Unsupported content type."), { status: 415 });
  }

  const rateLimit = checkRateLimit(request, {
    bucket: "admin:products:update",
    limit: 45,
    windowMs: 10 * 60 * 1000,
  });
  if (!rateLimit.ok) {
    return NextResponse.json(failure("Too many product update requests. Please retry shortly."), {
      status: 429,
      headers: { "Retry-After": String(rateLimit.retryAfterSeconds) },
    });
  }

  const admin = await requireAdminUser();

  if (!admin) {
    return NextResponse.json(failure("Unauthorized"), { status: 403 });
  }

  const { id } = await context.params;

  try {
    const json = await request.json();
    const parsed = adminProductUpdateSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(failure("Invalid update payload"), { status: 400 });
    }

    const updated = await updateProductById(id, parsed.data);

    if (!updated) {
      return NextResponse.json(failure("Product not found"), { status: 404 });
    }

    return NextResponse.json(success("Product updated", updated));
  } catch (error) {
    console.error("[admin.products.update] Failed to update product", error);
    const { message, status } = resolveProductWriteError(error);
    return NextResponse.json(failure(message), { status });
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  if (!isTrustedOrigin(request)) {
    return NextResponse.json(failure("Invalid request origin."), { status: 403 });
  }

  const rateLimit = checkRateLimit(request, {
    bucket: "admin:products:delete",
    limit: 20,
    windowMs: 10 * 60 * 1000,
  });
  if (!rateLimit.ok) {
    return NextResponse.json(failure("Too many product delete requests. Please retry shortly."), {
      status: 429,
      headers: { "Retry-After": String(rateLimit.retryAfterSeconds) },
    });
  }

  const admin = await requireAdminUser();

  if (!admin) {
    return NextResponse.json(failure("Unauthorized"), { status: 403 });
  }

  const { id } = await context.params;

  try {
    const deleted = await deleteProductById(id);

    if (!deleted) {
      return NextResponse.json(failure("Product not found"), { status: 404 });
    }

    return NextResponse.json(success("Product deleted", {}));
  } catch {
    return NextResponse.json(failure("Could not delete product"), { status: 500 });
  }
}
