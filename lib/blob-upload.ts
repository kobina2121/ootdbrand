const unsafePathCharactersPattern = /[^a-z0-9._-]+/g;

export function buildImageBlobPath(folder: "products" | "custom-orders", fileName: string) {
  const safeFileName =
    fileName
      .trim()
      .toLowerCase()
      .replace(unsafePathCharactersPattern, "-")
      .replace(/^-+|-+$/g, "") || "image";

  return `${folder}/${safeFileName}`;
}
