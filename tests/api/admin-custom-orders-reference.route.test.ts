import { beforeEach, describe, expect, it, vi } from "vitest";

import { requireAdminUser } from "@/lib/auth/guards";
import { CustomOrderModel } from "@/lib/db/models/custom-order";
import { connectToDatabase } from "@/lib/db/mongoose";

vi.mock("@/lib/auth/guards", () => ({
  requireAdminUser: vi.fn(),
}));

vi.mock("@/lib/db/mongoose", () => ({
  connectToDatabase: vi.fn(),
}));

vi.mock("@/lib/db/models/custom-order", () => ({
  CustomOrderModel: {
    findOneAndUpdate: vi.fn(),
    findOneAndDelete: vi.fn(),
  },
}));

import { DELETE, PATCH } from "@/app/api/admin/custom-orders/[reference]/route";

const mockRequireAdminUser = vi.mocked(requireAdminUser);
const mockConnectToDatabase = vi.mocked(connectToDatabase);
const mockFindOneAndUpdate = vi.mocked(CustomOrderModel.findOneAndUpdate);
const mockFindOneAndDelete = vi.mocked(CustomOrderModel.findOneAndDelete);

const context = {
  params: Promise.resolve({ reference: "CUS-ORDER-123" }),
};

function mockLeanResult<T>(value: T) {
  return {
    lean: vi.fn().mockResolvedValue(value),
  };
}

describe("Admin custom order reference route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockConnectToDatabase.mockResolvedValue(undefined);
  });

  it("returns 403 for unauthorized delete", async () => {
    mockRequireAdminUser.mockResolvedValue(null);

    const response = await DELETE(new Request("http://localhost:3000/api/admin/custom-orders/CUS-ORDER-123"), context);
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body).toMatchObject({ ok: false, message: "Unauthorized" });
  });

  it("returns 400 when patch payload is empty", async () => {
    mockRequireAdminUser.mockResolvedValue({ user: { id: "admin-id", role: "admin" } } as never);

    const request = new Request("http://localhost:3000/api/admin/custom-orders/CUS-ORDER-123", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({}),
    });

    const response = await PATCH(request, context);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toMatchObject({ ok: false, message: "No update provided" });
  });

  it("applies shipped delivery status with default custom-order admin update", async () => {
    mockRequireAdminUser.mockResolvedValue({ user: { id: "admin-id", role: "admin" } } as never);
    mockFindOneAndUpdate.mockReturnValue(
      mockLeanResult({ _id: "custom-1", paymentReference: "CUS-ORDER-123" }) as never,
    );

    const request = new Request("http://localhost:3000/api/admin/custom-orders/CUS-ORDER-123", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ deliveryStatus: "Shipped" }),
    });

    const response = await PATCH(request, context);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({ ok: true, message: "Custom order updated" });
    expect(mockFindOneAndUpdate).toHaveBeenCalledWith(
      { paymentReference: "CUS-ORDER-123" },
      {
        $set: {
          deliveryStatus: "Shipped",
          adminUpdate: "Your custom order is being delivered.",
        },
      },
      { returnDocument: "after" },
    );
  });

  it("applies delivered delivery status with default custom-order admin update", async () => {
    mockRequireAdminUser.mockResolvedValue({ user: { id: "admin-id", role: "admin" } } as never);
    mockFindOneAndUpdate.mockReturnValue(
      mockLeanResult({ _id: "custom-2", paymentReference: "CUS-ORDER-123" }) as never,
    );

    const request = new Request("http://localhost:3000/api/admin/custom-orders/CUS-ORDER-123", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ deliveryStatus: "Delivered" }),
    });

    const response = await PATCH(request, context);

    expect(response.status).toBe(200);
    expect(mockFindOneAndUpdate).toHaveBeenCalledWith(
      { paymentReference: "CUS-ORDER-123" },
      {
        $set: {
          deliveryStatus: "Delivered",
          adminUpdate: "Your custom order has been delivered.",
        },
      },
      { returnDocument: "after" },
    );
  });

  it("deletes a custom order successfully", async () => {
    mockRequireAdminUser.mockResolvedValue({ user: { id: "admin-id", role: "admin" } } as never);
    mockFindOneAndDelete.mockReturnValue(
      mockLeanResult({ _id: "custom-3", paymentReference: "CUS-ORDER-123" }) as never,
    );

    const response = await DELETE(new Request("http://localhost:3000/api/admin/custom-orders/CUS-ORDER-123"), context);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({ ok: true, message: "Custom order deleted" });
    expect(mockFindOneAndDelete).toHaveBeenCalledWith({ paymentReference: "CUS-ORDER-123" });
  });
});
