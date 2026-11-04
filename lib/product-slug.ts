export function normalizeProductSlug(value: string) {
  return (
    value
      .trim()
      .toLowerCase()
      .replace(/&/g, "and")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "product"
  );
}

export function encodeProductSlugForPath(slug: string) {
  return encodeURIComponent(slug);
}

export function buildProductHref(slug: string, options: { color?: string; size?: string } = {}) {
  const query = new URLSearchParams();

  if (options.color) {
    query.set("color", options.color);
  }

  if (options.size) {
    query.set("size", options.size);
  }

  const queryString = query.toString();
  return `/products/${encodeProductSlugForPath(slug)}${queryString ? `?${queryString}` : ""}`;
}

export function getProductSlugLookupCandidates(value: string) {
  const trimmed = value.trim();
  const decoded = safeDecodeURIComponent(trimmed);

  return Array.from(
    new Set([
      trimmed.toLowerCase(),
      decoded.toLowerCase(),
      normalizeProductSlug(trimmed),
      normalizeProductSlug(decoded),
    ].filter(Boolean)),
  );
}

function safeDecodeURIComponent(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}
