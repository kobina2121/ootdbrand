import { beforeEach, describe, expect, it, vi } from "vitest";

import { requireAdminUser } from "@/lib/auth/guards";
import { createProduct, listProducts } from "@/lib/services/product-service";
import { revalidatePath } from "next/cache";

vi.mock("@/lib/auth/guards", () => ({
  requireAdminUser: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/services/product-service", () => ({
  createProduct: vi.fn(),
  listProducts: vi.fn(),
}));

import { GET, POST } from "@/app/api/admin/products/route";

const mockRequireAdminUser = vi.mocked(requireAdminUser);
const mockCreateProduct = vi.mocked(createProduct);
const mockListProducts = vi.mocked(listProducts);
const mockRevalidatePath = vi.mocked(revalidatePath);

const validPayload = {
  name: "Test Dress",
  slug: "test-dress",
  description: "A beautiful dress for special events.",
  category: "MAXI",
  tags: ["evening"],
  basePrice: 350,
  images: ["/uploads/products/pic.jpg"],
  variants: [
    {
      name: "Wine Test Dress",
      size: "M",
      color: { name: "Wine", code: "#7A1730" },
      sku: "TEST-DRESS-WINE-M",
      stock: 8,
    },
  ],
  isActive: true,
};

describe("Admin products route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 403 for unauthenticated admin list request", async () => {
    mockRequireAdminUser.mockResolvedValue(null);

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body).toMatchObject({ ok: false, message: "Unauthorized" });
  });

  it("lists products for authorized admin", async () => {
    mockRequireAdminUser.mockResolvedValue({ user: { id: "admin-id", role: "admin" } } as never);
    mockListProducts.mockResolvedValue([{ slug: "test-dress", name: "Test Dress" }] as never);

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      ok: true,
      message: "Products fetched",
      data: { products: [{ slug: "test-dress", name: "Test Dress" }] },
    });
  });

  it("creates product for authorized admin", async () => {
    mockRequireAdminUser.mockResolvedValue({ user: { id: "admin-id", role: "admin" } } as never);
    mockCreateProduct.mockResolvedValue({ id: "product-1", slug: "test-dress" } as never);

    const request = new Request("http://localhost:3000/api/admin/products", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(validPayload),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body).toMatchObject({
      ok: true,
      message: "Product created",
      data: { id: "product-1", slug: "test-dress" },
    });
    expect(mockCreateProduct).toHaveBeenCalledWith(validPayload);
    expect(mockRevalidatePath).toHaveBeenCalledWith("/");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/products");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/custom-order");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/admin/products");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/products/test-dress");
  });

  it("returns 409 on duplicate slug", async () => {
    mockRequireAdminUser.mockResolvedValue({ user: { id: "admin-id", role: "admin" } } as never);
    const duplicateError = Object.assign(new Error("duplicate"), {
      code: 11000,
      keyPattern: { slug: 1 },
    });
    mockCreateProduct.mockRejectedValue(duplicateError);

    const request = new Request("http://localhost:3000/api/admin/products", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(validPayload),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(409);
    expect(body).toMatchObject({
      ok: false,
      message: "Product slug already exists. Use a different slug.",
    });
  });
});
