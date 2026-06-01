import nodemailer from "nodemailer";

type SendResetPasswordEmailInput = {
  to: string;
  resetUrl: string;
  brandName?: string;
};

type SendAdminOrderEmailInput = {
  orderType: "Store Order" | "Custom Order";
  reference: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  amountText: string;
  createdAtText: string;
  adminLink: string;
};

function getSmtpConfig() {
  const host = process.env.SMTP_HOST?.trim();
  const port = Number(process.env.SMTP_PORT || "587");
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS;
  const from = process.env.EMAIL_FROM?.trim();

  if (!host || !port || !user || !pass || !from) {
    return null;
  }

  return {
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass,
    },
    from,
  };
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function isSmtpConfigured() {
  return Boolean(getSmtpConfig());
}

export async function sendResetPasswordEmail(input: SendResetPasswordEmailInput) {
  const config = getSmtpConfig();

  if (!config) {
    throw new Error("SMTP is not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, and EMAIL_FROM.");
  }

  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: config.auth,
  });

  const brandName = input.brandName || "theootd.brand";
  const safeBrandName = escapeHtml(brandName);
  const safeResetUrl = escapeHtml(input.resetUrl);

  await transporter.sendMail({
    from: config.from,
    to: input.to,
    subject: `${brandName} password reset`,
    text: `You requested a password reset.\n\nOpen this link to reset your password:\n${input.resetUrl}\n\nIf you did not request this, you can ignore this email.`,
    html: `
      <div style="font-family: Arial, sans-serif; color: #1f1b18; line-height: 1.6;">
        <h2 style="margin: 0 0 12px;">${safeBrandName} Password Reset</h2>
        <p>You requested a password reset for your account.</p>
        <p>
          <a href="${safeResetUrl}" style="display: inline-block; padding: 10px 18px; border-radius: 999px; background: #1f1b18; color: #ffffff; text-decoration: none;">
            Reset Password
          </a>
        </p>
        <p style="font-size: 13px; color: #6b645e;">
          If the button does not work, copy and paste this link into your browser:<br/>
          <a href="${safeResetUrl}" style="color: #1f1b18;">${safeResetUrl}</a>
        </p>
        <p style="font-size: 13px; color: #6b645e;">If you did not request this, you can safely ignore this email.</p>
      </div>
    `,
  });
}

export async function sendAdminOrderEmail(input: SendAdminOrderEmailInput) {
  const config = getSmtpConfig();
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();

  if (!config || !adminEmail) {
    return;
  }

  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: config.auth,
  });

  const safeType = escapeHtml(input.orderType);
  const safeReference = escapeHtml(input.reference);
  const safeName = escapeHtml(input.customerName);
  const safeEmail = escapeHtml(input.customerEmail);
  const safePhone = escapeHtml(input.customerPhone);
  const safeAmount = escapeHtml(input.amountText);
  const safeCreatedAt = escapeHtml(input.createdAtText);
  const safeAdminLink = escapeHtml(input.adminLink);

  await transporter.sendMail({
    from: config.from,
    to: adminEmail,
    subject: `[theootd.brand] New ${input.orderType} • ${input.reference}`,
    text: [
      `New ${input.orderType} received.`,
      `Reference: ${input.reference}`,
      `Customer: ${input.customerName}`,
      `Email: ${input.customerEmail}`,
      `Phone: ${input.customerPhone}`,
      `Amount: ${input.amountText}`,
      `Created At: ${input.createdAtText}`,
      `View in admin: ${input.adminLink}`,
    ].join("\n"),
    html: `
      <div style="font-family: Arial, sans-serif; color: #1f1b18; line-height: 1.6;">
        <h2 style="margin: 0 0 12px;">New ${safeType} Received</h2>
        <p style="margin: 0 0 8px;"><strong>Reference:</strong> ${safeReference}</p>
        <p style="margin: 0 0 8px;"><strong>Customer:</strong> ${safeName}</p>
        <p style="margin: 0 0 8px;"><strong>Email:</strong> ${safeEmail}</p>
        <p style="margin: 0 0 8px;"><strong>Phone:</strong> ${safePhone}</p>
        <p style="margin: 0 0 8px;"><strong>Amount:</strong> ${safeAmount}</p>
        <p style="margin: 0 0 16px;"><strong>Created At:</strong> ${safeCreatedAt}</p>
        <p>
          <a href="${safeAdminLink}" style="display: inline-block; padding: 10px 18px; border-radius: 999px; background: #1f1b18; color: #ffffff; text-decoration: none;">
            Open Admin Dashboard
          </a>
        </p>
      </div>
    `,
  });
}
