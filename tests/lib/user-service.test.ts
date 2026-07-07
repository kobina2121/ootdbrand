import { beforeEach, describe, expect, it, vi } from "vitest";

const mockConnectToDatabase = vi.fn();
const mockCountDocuments = vi.fn();
const mockLean = vi.fn();
const mockLimit = vi.fn(() => ({ lean: mockLean }));
const mockSkip = vi.fn(() => ({ limit: mockLimit }));
const mockSort = vi.fn(() => ({ skip: mockSkip }));
const mockSelect = vi.fn(() => ({ sort: mockSort }));
const mockFind = vi.fn(() => ({ select: mockSelect }));

vi.mock("@/lib/db/mongoose", () => ({
  connectToDatabase: mockConnectToDatabase,
}));

vi.mock("@/lib/db/models/user", () => ({
  UserModel: {
    countDocuments: mockCountDocuments,
    find: mockFind,
  },
}));

describe("countRegisteredUsers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns the total number of users in the database", async () => {
    mockCountDocuments.mockResolvedValue(42);

    const { countRegisteredUsers } = await import("@/lib/services/user-service");

    await expect(countRegisteredUsers()).resolves.toBe(42);
    expect(mockConnectToDatabase).toHaveBeenCalledTimes(1);
    expect(mockCountDocuments).toHaveBeenCalledWith({});
  });

  it("lists users for the admin user page", async () => {
    mockLean.mockResolvedValue([
      {
        _id: "user-1",
        name: "Ama Customer",
        email: "ama@example.com",
        role: "customer",
        emailVerifiedAt: new Date("2026-01-01T00:00:00.000Z"),
        pendingEmail: undefined,
        createdAt: new Date("2026-01-02T00:00:00.000Z"),
      },
    ]);
    mockCountDocuments.mockResolvedValue(21);

    const { listRegisteredUsersForAdmin } = await import("@/lib/services/user-service");

    await expect(listRegisteredUsersForAdmin({ page: 2, pageSize: 20 })).resolves.toEqual({
      users: [
        {
          id: "user-1",
          name: "Ama Customer",
          email: "ama@example.com",
          role: "customer",
          pendingEmail: undefined,
          emailVerified: true,
          createdAt: "2026-01-02T00:00:00.000Z",
        },
      ],
      pagination: {
        page: 2,
        pageSize: 20,
        totalCount: 21,
        totalPages: 2,
      },
    });
    expect(mockFind).toHaveBeenCalledWith({});
    expect(mockSelect).toHaveBeenCalledWith("_id name email role emailVerifiedAt pendingEmail createdAt");
    expect(mockSort).toHaveBeenCalledWith({ createdAt: -1 });
    expect(mockSkip).toHaveBeenCalledWith(20);
    expect(mockLimit).toHaveBeenCalledWith(20);
    expect(mockLean).toHaveBeenCalledTimes(1);
  });
});
