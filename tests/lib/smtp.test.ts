import nodemailer from "nodemailer";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { sendAdminOrderEmail } from "@/lib/email/smtp";

vi.mock("nodemailer", () => ({
  default: {
    createTransport: vi.fn(),
  },
}));

const originalEnv = process.env;

describe("admin order emails", () => {
  const sendMail = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = {
      ...originalEnv,
      SMTP_HOST: "smtp.example.com",
      SMTP_PORT: "587",
      SMTP_USER: "sender@example.com",
      SMTP_PASS: "password",
      EMAIL_FROM: "theootd.brand <sender@example.com>",
    };
    delete process.env.ADMIN_ORDER_NOTIFICATION_EMAIL;
    vi.mocked(nodemailer.createTransport).mockReturnValue({ sendMail } as never);
  });

  afterEach(() => {
    process.env = originalEnv;
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

    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        html: expect.stringContaining("Payment Confirmed"),
        to: "adelineyeboah62@gmail.com",
        subject: "[theootd.brand] Paid Store Order • PSK-ORDER-123",
      }),
    );
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

    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "orders@example.com",
        subject: "[theootd.brand] Paid Custom Order • CUS-ORDER-123",
      }),
    );
  });
});
