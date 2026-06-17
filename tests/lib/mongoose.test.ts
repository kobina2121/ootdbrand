import { afterEach, describe, expect, it, vi } from "vitest";

describe("buildMongoUri", () => {
  afterEach(async () => {
    vi.resetModules();
    delete process.env.MONGODB_DB_NAME;
  });

  it("normalizes mongodb+srv URIs with a default database name and write params", async () => {
    process.env.MONGODB_DB_NAME = "tide-brand";

    const { buildMongoUri } = await import("@/lib/db/mongoose");

    expect(
      buildMongoUri("mongodb+srv://user:pass@example.mongodb.net/?appName=theootd-brand"),
    ).toBe(
      "mongodb+srv://user:pass@example.mongodb.net/tide-brand?appName=theootd-brand&retryWrites=true&w=majority",
    );
  });

  it("normalizes direct Atlas URIs with multiple hosts", async () => {
    process.env.MONGODB_DB_NAME = "tide-brand";

    const { buildMongoUri } = await import("@/lib/db/mongoose");

    expect(
      buildMongoUri(
        "mongodb://user:pass@host-a.mongodb.net:27017,host-b.mongodb.net:27017,host-c.mongodb.net:27017/?ssl=true&replicaSet=atlas-abc123-shard-0&authSource=admin&appName=theootd-brand",
      ),
    ).toBe(
      "mongodb://user:pass@host-a.mongodb.net:27017,host-b.mongodb.net:27017,host-c.mongodb.net:27017/tide-brand?ssl=true&replicaSet=atlas-abc123-shard-0&authSource=admin&appName=theootd-brand&retryWrites=true&w=majority",
    );
  });

  it("preserves an explicit database name in a direct URI", async () => {
    process.env.MONGODB_DB_NAME = "ignored-db-name";

    const { buildMongoUri } = await import("@/lib/db/mongoose");

    expect(
      buildMongoUri("mongodb://user:pass@host-a.mongodb.net:27017,host-b.mongodb.net:27017/existing-db?ssl=true"),
    ).toBe(
      "mongodb://user:pass@host-a.mongodb.net:27017,host-b.mongodb.net:27017/existing-db?ssl=true&retryWrites=true&w=majority",
    );
  });
});
