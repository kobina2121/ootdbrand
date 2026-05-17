import { createHmac } from "node:crypto";

const PAYSTACK_API_BASE_URL = process.env.PAYSTACK_API_BASE_URL ?? "https://api.paystack.co";

type PaystackInitializeInput = {
  email: string;
  amountSubunit: number;
  reference: string;
  callbackUrl: string;
  cancelUrl: string;
  metadata?: Record<string, unknown>;
};

type PaystackInitializeResponse = {
  status: boolean;
  message: string;
  data: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
};

type PaystackVerifyResponse = {
  status: boolean;
  message: string;
  data: {
    status: string;
    reference: string;
    amount: number;
    currency: string;
    gateway_response?: string;
    paid_at?: string | null;
  };
};

function getPaystackSecretKey() {
  const secret = process.env.PAYSTACK_SECRET_KEY;

  if (!secret) {
    throw new Error("Missing PAYSTACK_SECRET_KEY environment variable");
  }

  return secret;
}

function getPaystackWebhookSecret() {
  const secret = process.env.PAYSTACK_WEBHOOK_SECRET ?? process.env.PAYSTACK_SECRET_KEY;

  if (!secret) {
    throw new Error("Missing PAYSTACK_WEBHOOK_SECRET or PAYSTACK_SECRET_KEY environment variable");
  }

  return secret;
}

async function paystackFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(`${PAYSTACK_API_BASE_URL}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${getPaystackSecretKey()}`,
        "Content-Type": "application/json",
        ...(init?.headers ?? {}),
      },
      cache: "no-store",
      signal: controller.signal,
    });

    let json: T;

    try {
      json = (await response.json()) as T;
    } catch {
      throw new Error(`Paystack API returned a non-JSON response (status ${response.status}).`);
    }

    if (!response.ok) {
      const message =
        typeof json === "object" &&
        json !== null &&
        "message" in json &&
        typeof (json as { message?: unknown }).message === "string"
          ? (json as { message: string }).message
          : `Paystack API request failed with status ${response.status}`;

      throw new Error(message);
    }

    return json;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Paystack request timed out.");
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export async function initializePaystackTransaction(input: PaystackInitializeInput) {
  return paystackFetch<PaystackInitializeResponse>("/transaction/initialize", {
    method: "POST",
    body: JSON.stringify({
      email: input.email,
      amount: Math.round(input.amountSubunit),
      currency: "GHS",
      reference: input.reference,
      callback_url: input.callbackUrl,
      metadata: {
        cancel_action: input.cancelUrl,
        ...input.metadata,
      },
    }),
  });
}

export async function verifyPaystackTransaction(reference: string) {
  return paystackFetch<PaystackVerifyResponse>(`/transaction/verify/${encodeURIComponent(reference)}`, {
    method: "GET",
  });
}

export function verifyPaystackWebhookSignature(rawBody: string, signature?: string | null) {
  if (!signature) {
    return false;
  }

  const digest = createHmac("sha512", getPaystackWebhookSecret()).update(rawBody).digest("hex");
  return digest === signature;
}

export type { PaystackVerifyResponse };
