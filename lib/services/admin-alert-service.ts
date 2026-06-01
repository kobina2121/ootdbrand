import { sendAdminOrderEmail } from "@/lib/email/smtp";
import { formatPriceNgn } from "@/lib/products";
import { createAdminNotification } from "@/lib/services/admin-notification-service";

type AdminAlertOrderInput = {
  orderType: "store-order" | "custom-order";
  reference: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  amount: number;
  createdAt: Date;
};

function getAppBaseUrl() {
  const raw = process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_URL ?? "http://localhost:3000";
  return raw.replace(/\/$/, "");
}

function orderTypeLabel(orderType: AdminAlertOrderInput["orderType"]) {
  return orderType === "custom-order" ? "Custom Order" : "Store Order";
}

function adminOrdersLink(orderType: AdminAlertOrderInput["orderType"]) {
  return orderType === "custom-order" ? "/admin/custom-orders" : "/admin/orders";
}

export async function notifyAdminNewOrder(input: AdminAlertOrderInput) {
  const typeLabel = orderTypeLabel(input.orderType);
  const baseUrl = getAppBaseUrl();
  const linkPath = adminOrdersLink(input.orderType);
  const link = `${baseUrl}${linkPath}`;
  const amountText = formatPriceNgn(input.amount);

  await createAdminNotification({
    type: input.orderType,
    title: `New ${typeLabel}`,
    message: `${input.customerName} placed a ${input.orderType === "custom-order" ? "custom" : "store"} order (${amountText}).`,
    link: linkPath,
    metadata: {
      reference: input.reference,
      customerEmail: input.customerEmail,
      customerPhone: input.customerPhone,
      amount: input.amount,
    },
  });

  await sendAdminOrderEmail({
    orderType: typeLabel,
    reference: input.reference,
    customerName: input.customerName,
    customerEmail: input.customerEmail,
    customerPhone: input.customerPhone,
    amountText,
    createdAtText: input.createdAt.toLocaleString("en-GH"),
    adminLink: link,
  });
}
