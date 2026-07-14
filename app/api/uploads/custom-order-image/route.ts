import { issueSignedToken } from "@vercel/blob";
import { handleUploadPresigned, type HandleUploadPresignedBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";

import { failure } from "@/lib/api-response";
import { checkRateLimit } from "@/lib/security/guards";

export const runtime = "nodejs";

const MAX_FILE_SIZE_BYTES = 8 * 1024 * 1024;
const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/heic",
  "image/heif",
] as const;

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as HandleUploadPresignedBody;
    const jsonResponse = await handleUploadPresigned({
      body,
      request,
      getSignedToken: async (pathname) => {
        const rateLimit = checkRateLimit(request, {
          bucket: "uploads:custom-order-image",
          limit: 10,
          windowMs: 10 * 60 * 1000,
        });
        if (!rateLimit.ok) {
          throw new Error("Too many image upload attempts. Please wait and try again.");
        }

        if (!pathname.startsWith("custom-orders/")) {
          throw new Error("Invalid upload path");
        }

        return {
          token: await issueSignedToken({
            pathname,
            operations: ["put"],
            allowedContentTypes: [...ALLOWED_MIME_TYPES],
            maximumSizeInBytes: MAX_FILE_SIZE_BYTES,
          }),
          urlOptions: {
            allowedContentTypes: [...ALLOWED_MIME_TYPES],
            maximumSizeInBytes: MAX_FILE_SIZE_BYTES,
            addRandomSuffix: true,
          },
        };
      },
      onUploadCompleted: async () => {},
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not upload image";

    return NextResponse.json(failure(message), { status: 400 });
  }
}
