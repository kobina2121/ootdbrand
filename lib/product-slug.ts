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
