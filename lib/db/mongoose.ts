import mongoose from "mongoose";

type CachedMongoose = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

declare global {
  var __mongooseCache: CachedMongoose | undefined;
}

const cached = global.__mongooseCache ?? { conn: null, promise: null };

if (!global.__mongooseCache) {
  global.__mongooseCache = cached;
}

const TRANSIENT_DB_ERROR_PATTERNS = [
  "tlsv1 alert internal error",
  "ssl alert number 80",
  "mongoserverselectionerror",
  "could not connect to any servers in your mongodb atlas cluster",
  "econnrefused",
  "etimedout",
  "querysrv",
];

function isTransientDbError(error: unknown) {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLowerCase();
  return TRANSIENT_DB_ERROR_PATTERNS.some((pattern) => message.includes(pattern));
}

async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

function buildMongoUri(rawUri: string) {
  const uri = rawUri.trim();

  let parsed: URL;
  try {
    parsed = new URL(uri);
  } catch {
    throw new Error("Invalid MONGODB_URI format");
  }

  const dbName = process.env.MONGODB_DB_NAME?.trim() || "theootd-brand";
  if (!parsed.pathname || parsed.pathname === "/") {
    parsed.pathname = `/${dbName}`;
  }

  if (!parsed.searchParams.has("retryWrites")) {
    parsed.searchParams.set("retryWrites", "true");
  }

  if (!parsed.searchParams.has("w")) {
    parsed.searchParams.set("w", "majority");
  }

  return parsed.toString();
}

function getMongoConnectionCandidates() {
  const directMongoUri = process.env.MONGODB_DIRECT_URI?.trim();
  const rawMongoUri = process.env.MONGODB_URI?.trim();

  const candidates = [
    directMongoUri ? { kind: "direct" as const, uri: buildMongoUri(directMongoUri) } : null,
    rawMongoUri ? { kind: "srv" as const, uri: buildMongoUri(rawMongoUri) } : null,
  ].filter((candidate): candidate is { kind: "direct" | "srv"; uri: string } => Boolean(candidate));

  if (!candidates.length) {
    throw new Error("Missing MONGODB_URI environment variable");
  }

  return candidates;
}

function normalizeMongoError(error: unknown) {
  if (!(error instanceof Error)) {
    return new Error("Database connection failed");
  }

  const message = error.message.toLowerCase();

  if (message.includes("querysrv") && message.includes("econnrefused")) {
    return new Error(
      "MongoDB SRV DNS lookup failed. Fix local DNS or set MONGODB_DIRECT_URI to the standard mongodb:// Atlas connection string.",
    );
  }

  return error;
}

export async function connectToDatabase() {
  const candidates = getMongoConnectionCandidates();

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const attemptConnect = async () => {
      let lastError: unknown;

      for (const candidate of candidates) {
        for (let attempt = 1; attempt <= 3; attempt += 1) {
          try {
            return await mongoose.connect(candidate.uri, {
              dbName: process.env.MONGODB_DB_NAME,
              serverSelectionTimeoutMS: 10000,
              socketTimeoutMS: 20000,
              family: 4,
            });
          } catch (error) {
            lastError = error;

            if (attempt >= 3 || !isTransientDbError(error)) {
              break;
            }

            await sleep(500 * attempt);
          }
        }
      }

      throw normalizeMongoError(lastError);
    };

    cached.promise = attemptConnect().catch((error) => {
      cached.promise = null;
      throw error;
    });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}
