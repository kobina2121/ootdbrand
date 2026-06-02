import { beforeEach, describe, expect, it, vi } from "vitest";

import { requireAdminUser } from "@/lib/auth/guards";
import { OrderModel } from "@/lib/db/models/order";
import { connectToDatabase } from "@/lib/db/mongoose";

vi.mock("@/lib/auth/guards", () => ({
  requireAdminUser: vi.fn(),
}));

vi.mock("@/lib/db/mongoose", () => ({
  connectToDatabase: vi.fn(),
}));

vi.mock("@/lib/db/models/order", () => ({
  OrderModel: {
    findOneAndUpdate: vi.fn(),
    findOneAndDelete: vi.fn(),
  },
}));

import { DELETE, PATCH } from "@/app/api/admin/orders/[reference]/route";

const mockRequireAdminUser = vi.mocked(requireAdminUser);
const mockConnectToDatabase = vi.mocked(connectToDatabase);
const mockFindOneAndUpdate = vi.mocked(OrderModel.findOneAndUpdate);
const mockFindOneAndDelete = vi.mocked(OrderModel.findOneAndDelete);

const context = {
  params: Promise.resolve({ reference: "PSK-ORDER-123" }),
};

function mockLeanResult<T>(value: T) {
  return {
    lean: vi.fn().mockResolvedValue(value),
  };
}

describe("Admin order reference route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockConnectToDatabase.mockResolvedValue(undefined);
  });

  it("returns 403 for unauthorized patch", async () => {
    mockRequireAdminUser.mockResolvedValue(null);

    const request = new Request("http://localhost:3000/api/admin/orders/PSK-ORDER-123", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ deliveryStatus: "Shipped" }),
    });

    const response = await PATCH(request, context);
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body).toMatchObject({ ok: false, message: "Unauthorized" });
  });

  it("returns 400 for invalid patch payload", async () => {
    mockRequireAdminUser.mockResolvedValue({ user: { id: "admin-id", role: "admin" } } as never);

    const request = new Request("http://localhost:3000/api/admin/orders/PSK-ORDER-123", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ trackingUrl: "not-a-url" }),
    });

    const response = await PATCH(request, context);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toMatchObject({ ok: false, message: "Invalid payload" });
  });

  it("applies shipped delivery status with default admin update", async () => {
    mockRequireAdminUser.mockResolvedValue({ user: { id: "admin-id", role: "admin" } } as never);
    mockFindOneAndUpdate.mockReturnValue(
      mockLeanResult({ _id: "order-1", paymentReference: "PSK-ORDER-123" }) as never,
    );

    const request = new Request("http://localhost:3000/api/admin/orders/PSK-ORDER-123", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ deliveryStatus: "Shipped" }),
    });

    const response = await PATCH(request, context);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({ ok: true, message: "Order updated" });
    expect(mockFindOneAndUpdate).toHaveBeenCalledWith(
      { paymentReference: "PSK-ORDER-123" },
      {
        $set: {
          deliveryStatus: "Shipped",
          adminUpdate: "Your order is being delivered.",
        },
      },
      { returnDocument: "after" },
    );
  });

  it("applies delivered delivery status with default admin update", async () => {
    mockRequireAdminUser.mockResolvedValue({ user: { id: "admin-id", role: "admin" } } as never);
    mockFindOneAndUpdate.mockReturnValue(
      mockLeanResult({ _id: "order-2", paymentReference: "PSK-ORDER-123" }) as never,
    );

    const request = new Request("http://localhost:3000/api/admin/orders/PSK-ORDER-123", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ deliveryStatus: "Delivered" }),
    });

    const response = await PATCH(request, context);

    expect(response.status).toBe(200);
    expect(mockFindOneAndUpdate).toHaveBeenCalledWith(
      { paymentReference: "PSK-ORDER-123" },
      {
        $set: {
          deliveryStatus: "Delivered",
          adminUpdate: "Your order has been delivered.",
        },
      },
      { returnDocument: "after" },
    );
  });

  it("deletes an order successfully", async () => {
    mockRequireAdminUser.mockResolvedValue({ user: { id: "admin-id", role: "admin" } } as never);
    mockFindOneAndDelete.mockReturnValue(
      mockLeanResult({ _id: "order-3", paymentReference: "PSK-ORDER-123" }) as never,
    );

    const response = await DELETE(new Request("http://localhost:3000/api/admin/orders/PSK-ORDER-123"), context);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({ ok: true, message: "Order deleted" });
    expect(mockFindOneAndDelete).toHaveBeenCalledWith({ paymentReference: "PSK-ORDER-123" });
  });
});
