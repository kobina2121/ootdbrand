import { beforeEach, describe, expect, it, vi } from "vitest";

import { requireAdminUser } from "@/lib/auth/guards";
import { deleteProductById, getProductById, updateProductById } from "@/lib/services/product-service";

vi.mock("@/lib/auth/guards", () => ({
  requireAdminUser: vi.fn(),
}));

vi.mock("@/lib/services/product-service", () => ({
  getProductById: vi.fn(),
  updateProductById: vi.fn(),
  deleteProductById: vi.fn(),
}));

import { DELETE, GET, PATCH } from "@/app/api/admin/products/[id]/route";

const mockRequireAdminUser = vi.mocked(requireAdminUser);
const mockGetProductById = vi.mocked(getProductById);
const mockUpdateProductById = vi.mocked(updateProductById);
const mockDeleteProductById = vi.mocked(deleteProductById);

const context = { params: Promise.resolve({ id: "507f1f77bcf86cd799439011" }) };

describe("Admin product by id route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 403 for unauthorized access", async () => {
    mockRequireAdminUser.mockResolvedValue(null);

    const response = await GET(new Request("http://localhost:3000/api/admin/products/id"), context);
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body).toMatchObject({ ok: false, message: "Unauthorized" });
  });

  it("returns product for authorized admin", async () => {
    mockRequireAdminUser.mockResolvedValue({ user: { id: "admin-id", role: "admin" } } as never);
    mockGetProductById.mockResolvedValue({ id: "p1", name: "Dress" } as never);

    const response = await GET(new Request("http://localhost:3000/api/admin/products/id"), context);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      ok: true,
      message: "Product fetched",
      data: { product: { id: "p1", name: "Dress" } },
    });
  });

  it("updates product and returns 200", async () => {
    mockRequireAdminUser.mockResolvedValue({ user: { id: "admin-id", role: "admin" } } as never);
    mockUpdateProductById.mockResolvedValue({ id: "p1", slug: "dress" } as never);

    const request = new Request("http://localhost:3000/api/admin/products/id", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ basePrice: 400 }),
    });

    const response = await PATCH(request, context);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      ok: true,
      message: "Product updated",
      data: { id: "p1", slug: "dress" },
    });
  });

  it("deletes product and returns 200", async () => {
    mockRequireAdminUser.mockResolvedValue({ user: { id: "admin-id", role: "admin" } } as never);
    mockDeleteProductById.mockResolvedValue(true);

    const response = await DELETE(new Request("http://localhost:3000/api/admin/products/id"), context);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      ok: true,
      message: "Product deleted",
    });
  });
});
