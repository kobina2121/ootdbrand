function normalizeSecret(value?: string | null) {
  return value?.trim() ?? "";
}

export function getAuthSecret() {
  const nextAuthSecret = normalizeSecret(process.env.NEXTAUTH_SECRET);
  const authSecret = normalizeSecret(process.env.AUTH_SECRET);

  if (nextAuthSecret && authSecret && nextAuthSecret !== authSecret) {
    throw new Error("NEXTAUTH_SECRET and AUTH_SECRET must match.");
  }

  if (nextAuthSecret) {
    return nextAuthSecret;
  }

  if (authSecret) {
    return authSecret;
  }

  if (process.env.NODE_ENV === "development") {
    return "theootd-dev-nextauth-secret-change-me";
  }

  throw new Error("Missing NEXTAUTH_SECRET or AUTH_SECRET environment variable.");
}

export function shouldUseSecureAuthCookies() {
  const appUrl = (process.env.NEXTAUTH_URL ?? process.env.AUTH_URL ?? "").trim().toLowerCase();

  if (appUrl.startsWith("https://")) {
    return true;
  }

  if (appUrl.startsWith("http://")) {
    return false;
  }

  return process.env.NODE_ENV === "production";
}

export function getSessionTokenCookieName() {
  const securePrefix = shouldUseSecureAuthCookies() ? "__Secure-" : "";
  return `${securePrefix}theootd.session-token.v1`;
}
