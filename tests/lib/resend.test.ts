import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { sendAdminOrderEmail } from "@/lib/email/resend";

const originalEnv = process.env;

describe("admin order emails", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = {
      ...originalEnv,
      RESEND_API_KEY: "re_test_key",
      EMAIL_FROM: "theootd.brand <sender@example.com>",
    };
    delete process.env.ADMIN_ORDER_NOTIFICATION_EMAIL;
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ id: "email-123" }),
    });
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.unstubAllGlobals();
  });

  it("sends new order notifications to Adeline by default", async () => {
    await sendAdminOrderEmail({
      orderType: "Store Order",
      reference: "PSK-ORDER-123",
      customerName: "Test Buyer",
      customerEmail: "buyer@example.com",
      customerPhone: "+233536477207",
      amountText: "GH₵250.00",
      createdAtText: "30/07/2026, 21:30:00",
      adminLink: "https://theootdbrand.com/admin/orders",
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.resend.com/emails",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer re_test_key",
          "Content-Type": "application/json",
        }),
        body: expect.any(String),
      }),
    );
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toMatchObject({
      from: "theootd.brand <sender@example.com>",
      html: expect.stringContaining("Payment Confirmed"),
      to: "adelineyeboah62@gmail.com",
      subject: "[theootd.brand] Paid Store Order • PSK-ORDER-123",
    });
  });

  it("allows the order notification recipient to be overridden with an environment variable", async () => {
    process.env.ADMIN_ORDER_NOTIFICATION_EMAIL = "orders@example.com";

    await sendAdminOrderEmail({
      orderType: "Custom Order",
      reference: "CUS-ORDER-123",
      customerName: "Custom Buyer",
      customerEmail: "custom@example.com",
      customerPhone: "+233536477207",
      amountText: "GH₵300.00",
      createdAtText: "30/07/2026, 21:35:00",
      adminLink: "https://theootdbrand.com/admin/custom-orders",
    });

    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toMatchObject({
      to: "orders@example.com",
      subject: "[theootd.brand] Paid Custom Order • CUS-ORDER-123",
    });
  });
});
