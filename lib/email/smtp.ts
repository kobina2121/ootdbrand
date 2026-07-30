import nodemailer from "nodemailer";

type SendResetPasswordEmailInput = {
  to: string;
  resetUrl: string;
  brandName?: string;
};

type SendEmailChangeVerificationEmailInput = {
  to: string;
  verificationCode: string;
  brandName?: string;
  currentEmail: string;
  verifyUrl?: string;
};

type SendSignupVerificationEmailInput = {
  to: string;
  verificationCode: string;
  brandName?: string;
  verifyUrl?: string;
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

const DEFAULT_ADMIN_ORDER_NOTIFICATION_EMAIL = "adelineyeboah62@gmail.com";

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

function getAdminOrderNotificationEmail() {
  return (
    process.env.ADMIN_ORDER_NOTIFICATION_EMAIL?.trim().toLowerCase() ||
    DEFAULT_ADMIN_ORDER_NOTIFICATION_EMAIL
  );
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

export async function sendEmailChangeVerificationEmail(input: SendEmailChangeVerificationEmailInput) {
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
  const safeCurrentEmail = escapeHtml(input.currentEmail);
  const safeVerificationCode = escapeHtml(input.verificationCode);
  const safeVerifyUrl = input.verifyUrl ? escapeHtml(input.verifyUrl) : null;

  await transporter.sendMail({
    from: config.from,
    to: input.to,
    subject: `${brandName} email verification`,
    text: [
      `You requested to change the email on your account from ${input.currentEmail}.`,
      "",
      `Your verification code is: ${input.verificationCode}`,
      "",
      "Enter this code inside your signed-in profile to finish the change.",
      ...(input.verifyUrl
        ? [
            "",
            `You can also use this verification link: ${input.verifyUrl}`,
          ]
        : []),
      "",
      "If you did not request this change, you can ignore this email.",
    ].join("\n"),
    html: `
      <div style="font-family: Arial, sans-serif; color: #1f1b18; line-height: 1.6;">
        <h2 style="margin: 0 0 12px;">Verify Your New ${safeBrandName} Email</h2>
        <p>You requested to change your account email from <strong>${safeCurrentEmail}</strong>.</p>
        <p>Your verification code is:</p>
        <p style="margin: 16px 0; font-size: 28px; font-weight: 700; letter-spacing: 0.3em;">${safeVerificationCode}</p>
        <p style="font-size: 13px; color: #6b645e;">Enter this code inside your signed-in profile to finish the email change.</p>
        ${
          safeVerifyUrl
            ? `<p>
          <a href="${safeVerifyUrl}" style="display: inline-block; padding: 10px 18px; border-radius: 999px; background: #1f1b18; color: #ffffff; text-decoration: none;">
            Verify with Link Instead
          </a>
        </p>
        <p style="font-size: 13px; color: #6b645e;">
          If the button does not work, copy and paste this link into your browser:<br/>
          <a href="${safeVerifyUrl}" style="color: #1f1b18;">${safeVerifyUrl}</a>
        </p>`
            : ""
        }
        <p style="font-size: 13px; color: #6b645e;">If you did not request this change, you can safely ignore this email.</p>
      </div>
    `,
  });
}

export async function sendSignupVerificationEmail(input: SendSignupVerificationEmailInput) {
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
  const safeVerificationCode = escapeHtml(input.verificationCode);
  const safeVerifyUrl = input.verifyUrl ? escapeHtml(input.verifyUrl) : null;

  await transporter.sendMail({
    from: config.from,
    to: input.to,
    subject: `${brandName} signup verification code`,
    text: [
      `Welcome to ${brandName}.`,
      "",
      `Your verification code is: ${input.verificationCode}`,
      "",
      "Enter this code to activate your account before logging in.",
      ...(input.verifyUrl
        ? [
            "",
            `Open this page to verify: ${input.verifyUrl}`,
          ]
        : []),
    ].join("\n"),
    html: `
      <div style="font-family: Arial, sans-serif; color: #1f1b18; line-height: 1.6;">
        <h2 style="margin: 0 0 12px;">Confirm Your ${safeBrandName} Account</h2>
        <p>Use this verification code to finish creating your account:</p>
        <p style="margin: 16px 0; font-size: 28px; font-weight: 700; letter-spacing: 0.3em;">${safeVerificationCode}</p>
        <p style="font-size: 13px; color: #6b645e;">Enter this code before logging in.</p>
        ${
          safeVerifyUrl
            ? `<p>
          <a href="${safeVerifyUrl}" style="display: inline-block; padding: 10px 18px; border-radius: 999px; background: #1f1b18; color: #ffffff; text-decoration: none;">
            Open Verification Page
          </a>
        </p>`
            : ""
        }
      </div>
    `,
  });
}

export async function sendAdminOrderEmail(input: SendAdminOrderEmailInput) {
  const config = getSmtpConfig();
  const adminEmail = getAdminOrderNotificationEmail();

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
    subject: `[theootd.brand] Paid ${input.orderType} • ${input.reference}`,
    text: [
      `Paid ${input.orderType} received.`,
      `Reference: ${input.reference}`,
      `Customer: ${input.customerName}`,
      `Email: ${input.customerEmail}`,
      `Phone: ${input.customerPhone}`,
      `Amount: ${input.amountText}`,
      `Created At: ${input.createdAtText}`,
      `View in admin: ${input.adminLink}`,
    ].join("\n"),
    html: `
      <div style="margin: 0; padding: 0; background: #f7f3ee; font-family: Arial, sans-serif; color: #1f1b18;">
        <div style="display: none; max-height: 0; overflow: hidden; opacity: 0;">
          Paid ${safeType} received from ${safeName} for ${safeAmount}.
        </div>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse; background: #f7f3ee;">
          <tr>
            <td align="center" style="padding: 32px 16px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 620px; border-collapse: collapse; overflow: hidden; border-radius: 28px; background: #fffdfa; box-shadow: 0 18px 45px rgba(31, 27, 24, 0.10);">
                <tr>
                  <td style="padding: 28px 30px 22px; background: #1f1b18;">
                    <p style="margin: 0 0 18px; color: #d8c9b8; font-size: 12px; letter-spacing: 0.22em; text-transform: uppercase;">theootd.brand</p>
                    <h1 style="margin: 0; color: #ffffff; font-size: 30px; line-height: 1.12; font-weight: 700;">Paid ${safeType} Received</h1>
                    <p style="margin: 12px 0 0; color: #d8c9b8; font-size: 14px; line-height: 1.6;">A customer payment has been confirmed. Review the order details and prepare fulfillment.</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 26px 30px 8px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse;">
                      <tr>
                        <td style="padding: 0 0 18px;">
                          <span style="display: inline-block; padding: 7px 12px; border-radius: 999px; background: #e9f9ef; color: #157347; font-size: 12px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase;">Payment Confirmed</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 20px; border: 1px solid #eee3d7; border-radius: 20px; background: #fbf7f2;">
                          <p style="margin: 0 0 6px; color: #8a8077; font-size: 12px; letter-spacing: 0.14em; text-transform: uppercase;">Order Total</p>
                          <p style="margin: 0; color: #1f1b18; font-size: 34px; line-height: 1; font-weight: 800;">${safeAmount}</p>
                          <p style="margin: 12px 0 0; color: #6d6660; font-size: 14px;">Reference: <strong style="color: #1f1b18;">${safeReference}</strong></p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 18px 30px 8px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse;">
                      <tr>
                        <td style="padding: 14px 0; border-bottom: 1px solid #efe7df;">
                          <p style="margin: 0 0 4px; color: #8a8077; font-size: 12px; text-transform: uppercase; letter-spacing: 0.12em;">Customer</p>
                          <p style="margin: 0; color: #1f1b18; font-size: 16px; font-weight: 700;">${safeName}</p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 14px 0; border-bottom: 1px solid #efe7df;">
                          <p style="margin: 0 0 4px; color: #8a8077; font-size: 12px; text-transform: uppercase; letter-spacing: 0.12em;">Contact</p>
                          <p style="margin: 0; color: #1f1b18; font-size: 15px;">${safeEmail}</p>
                          <p style="margin: 4px 0 0; color: #1f1b18; font-size: 15px;">${safePhone}</p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 14px 0;">
                          <p style="margin: 0 0 4px; color: #8a8077; font-size: 12px; text-transform: uppercase; letter-spacing: 0.12em;">Confirmed At</p>
                          <p style="margin: 0; color: #1f1b18; font-size: 15px;">${safeCreatedAt}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 20px 30px 32px;">
                    <a href="${safeAdminLink}" style="display: block; padding: 15px 22px; border-radius: 999px; background: #1f1b18; color: #ffffff; font-size: 15px; font-weight: 700; text-align: center; text-decoration: none;">
                      Open Order In Admin
                    </a>
                    <p style="margin: 16px 0 0; color: #8a8077; font-size: 12px; line-height: 1.6; text-align: center;">
                      This notification is sent only after the order is confirmed paid.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </div>
    `,
  });
}
