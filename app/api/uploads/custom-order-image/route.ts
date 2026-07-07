import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { NextResponse } from "next/server";

import { failure, success } from "@/lib/api-response";
import { checkRateLimit } from "@/lib/security/guards";

export const runtime = "nodejs";

const MAX_FILE_SIZE_BYTES = 8 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/heic",
  "image/heif",
]);

const extensionByMimeType: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/avif": ".avif",
  "image/heic": ".heic",
  "image/heif": ".heif",
};

export async function POST(request: Request) {
  try {
    const rateLimit = checkRateLimit(request, {
      bucket: "uploads:custom-order-image",
      limit: 10,
      windowMs: 10 * 60 * 1000,
    });
    if (!rateLimit.ok) {
      return NextResponse.json(failure("Too many image upload attempts. Please wait and try again."), {
        status: 429,
        headers: { "Retry-After": String(rateLimit.retryAfterSeconds) },
      });
    }

    const formData = await request.formData();
    const fileEntry = formData.get("file");

    if (!(fileEntry instanceof File)) {
      return NextResponse.json(failure("No file uploaded"), { status: 400 });
    }

    if (!ALLOWED_MIME_TYPES.has(fileEntry.type)) {
      return NextResponse.json(failure("Unsupported image type"), { status: 400 });
    }

    if (fileEntry.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(failure("Image is too large (max 8MB)"), { status: 400 });
    }

    const extension = extensionByMimeType[fileEntry.type] ?? path.extname(fileEntry.name) ?? ".jpg";
    const fileName = `custom-order-${randomUUID()}${extension}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads", "custom-orders");
    const filePath = path.join(uploadDir, fileName);

    await mkdir(uploadDir, { recursive: true });

    const buffer = Buffer.from(await fileEntry.arrayBuffer());
    await writeFile(filePath, buffer);

    const imagePath = `/uploads/custom-orders/${fileName}`;

    return NextResponse.json(success("Image uploaded", { imagePath }), { status: 201 });
  } catch {
    return NextResponse.json(failure("Could not upload image"), { status: 500 });
  }
}
