import { beforeEach, describe, expect, it, vi } from "vitest";

const mockConnectToDatabase = vi.fn();
const mockOrderFindOne = vi.fn();
const mockOrderFindOneAndUpdate = vi.fn();
const mockCustomOrderFindOne = vi.fn();
const mockCustomOrderFindOneAndUpdate = vi.fn();
const mockNotifyAdminNewOrder = vi.hoisted(() => vi.fn());

vi.mock("@/lib/db/mongoose", () => ({
  connectToDatabase: mockConnectToDatabase,
}));

vi.mock("@/lib/db/models/order", () => ({
  OrderModel: {
    findOne: mockOrderFindOne,
    findOneAndUpdate: mockOrderFindOneAndUpdate,
  },
}));

vi.mock("@/lib/db/models/custom-order", () => ({
  CustomOrderModel: {
    findOne: mockCustomOrderFindOne,
    findOneAndUpdate: mockCustomOrderFindOneAndUpdate,
  },
}));

vi.mock("@/lib/db/models/product", () => ({
  ProductModel: {},
}));

vi.mock("@/lib/services/admin-alert-service", () => ({
  notifyAdminNewOrder: mockNotifyAdminNewOrder,
}));

function leanResult<T>(value: T) {
  return {
    lean: vi.fn().mockResolvedValue(value),
  };
}

const storeOrder = {
  _id: "order-1",
  paymentReference: "PSK-ABANDONED",
  amountTotal: 250,
  currency: "GHS",
  status: "Failed",
  createdAt: new Date("2026-07-30T20:30:00.000Z"),
  shippingAddress: {
    fullName: "Store Buyer",
    email: "buyer@example.com",
    phone: "+233536477207",
  },
};

const customOrder = {
  _id: "custom-order-1",
  paymentReference: "CUS-ABANDONED",
  amountTotal: 250,
  currency: "GHS",
  status: "Failed",
  createdAt: new Date("2026-07-30T20:45:00.000Z"),
  fullName: "Custom Buyer",
  email: "custom@example.com",
  phone: "+233536477208",
};

describe("payment reconciliation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNotifyAdminNewOrder.mockResolvedValue(null);
    mockOrderFindOne.mockReturnValue(leanResult(storeOrder));
    mockCustomOrderFindOne.mockReturnValue(leanResult(customOrder));
  });

  it("keeps abandoned store orders pending instead of failed", async () => {
    mockOrderFindOneAndUpdate.mockReturnValue(leanResult({ ...storeOrder, status: "Pending" }));
    const { reconcileOrderAfterVerification } = await import("@/lib/services/order-service");

    await expect(
      reconcileOrderAfterVerification("PSK-ABANDONED", {
        status: "abandoned",
        amountSubunit: 25000,
        currency: "GHS",
        paidAt: null,
        gatewayResponse: "The transaction was not completed",
      }),
    ).resolves.toMatchObject({
      status: "Pending",
      reason: "gateway-incomplete",
    });

    expect(mockOrderFindOneAndUpdate).toHaveBeenCalledWith(
      { paymentReference: "PSK-ABANDONED", status: { $ne: "Success" } },
      {
        $set: {
          status: "Pending",
          paymentGatewayStatus: "abandoned",
          paymentGatewayResponse: "The transaction was not completed",
        },
      },
      { returnDocument: "after" },
    );
    expect(mockNotifyAdminNewOrder).not.toHaveBeenCalled();
  });

  it("keeps abandoned custom orders pending instead of failed", async () => {
    mockCustomOrderFindOneAndUpdate.mockReturnValue(leanResult({ ...customOrder, status: "Pending" }));
    const { reconcileCustomOrderAfterVerification } = await import("@/lib/services/custom-order-service");

    await expect(
      reconcileCustomOrderAfterVerification("CUS-ABANDONED", {
        status: "abandoned",
        amountSubunit: 25000,
        currency: "GHS",
        paidAt: null,
        gatewayResponse: "The transaction was not completed",
      }),
    ).resolves.toMatchObject({
      status: "Pending",
      reason: "gateway-incomplete",
    });

    expect(mockCustomOrderFindOneAndUpdate).toHaveBeenCalledWith(
      { paymentReference: "CUS-ABANDONED", status: { $ne: "Success" } },
      {
        $set: {
          status: "Pending",
          paymentGatewayStatus: "abandoned",
          paymentGatewayResponse: "The transaction was not completed",
        },
      },
      { returnDocument: "after" },
    );
    expect(mockNotifyAdminNewOrder).not.toHaveBeenCalled();
  });

  it("notifies admin only after a store order is verified successful", async () => {
    const paidOrder = {
      ...storeOrder,
      paymentReference: "PSK-SUCCESS",
      status: "Success",
    };
    mockOrderFindOne.mockReturnValue(leanResult({ ...storeOrder, paymentReference: "PSK-SUCCESS", status: "Pending" }));
    mockOrderFindOneAndUpdate.mockReturnValue(leanResult(paidOrder));
    const { reconcileOrderAfterVerification } = await import("@/lib/services/order-service");

    await expect(
      reconcileOrderAfterVerification("PSK-SUCCESS", {
        status: "success",
        amountSubunit: 25000,
        currency: "GHS",
        paidAt: "2026-07-30T21:00:00.000Z",
        gatewayResponse: "Successful",
      }),
    ).resolves.toMatchObject({
      status: "Success",
      reason: "verified-success",
    });

    expect(mockNotifyAdminNewOrder).toHaveBeenCalledWith({
      orderType: "store-order",
      reference: "PSK-SUCCESS",
      customerName: "Store Buyer",
      customerEmail: "buyer@example.com",
      customerPhone: "+233536477207",
      amount: 250,
      createdAt: storeOrder.createdAt,
    });
  });

  it("notifies admin only after a custom order is verified successful", async () => {
    const paidCustomOrder = {
      ...customOrder,
      paymentReference: "CUS-SUCCESS",
      status: "Success",
    };
    mockCustomOrderFindOne.mockReturnValue(
      leanResult({ ...customOrder, paymentReference: "CUS-SUCCESS", status: "Pending" }),
    );
    mockCustomOrderFindOneAndUpdate.mockReturnValue(leanResult(paidCustomOrder));
    const { reconcileCustomOrderAfterVerification } = await import("@/lib/services/custom-order-service");

    await expect(
      reconcileCustomOrderAfterVerification("CUS-SUCCESS", {
        status: "success",
        amountSubunit: 25000,
        currency: "GHS",
        paidAt: "2026-07-30T21:05:00.000Z",
        gatewayResponse: "Successful",
      }),
    ).resolves.toMatchObject({
      status: "Success",
      reason: "verified-success",
    });

    expect(mockNotifyAdminNewOrder).toHaveBeenCalledWith({
      orderType: "custom-order",
      reference: "CUS-SUCCESS",
      customerName: "Custom Buyer",
      customerEmail: "custom@example.com",
      customerPhone: "+233536477208",
      amount: 250,
      createdAt: customOrder.createdAt,
    });
  });
});
