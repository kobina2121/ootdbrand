import { createHash, randomBytes } from "node:crypto";

import bcrypt from "bcryptjs";
import { Types } from "mongoose";

import { connectToDatabase } from "@/lib/db/mongoose";
import { UserModel, type UserRole } from "@/lib/db/models/user";

const defaultDevAdmin = {
  email: "admin@theootd.brand",
  password: "Admin@12345",
  name: "Store Admin",
} as const;

function getAdminAuthConfig() {
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase() || "";
  const adminPassword = process.env.ADMIN_PASSWORD || "";
  const adminName = process.env.ADMIN_NAME?.trim() || "Store Admin";
  const allowDevFallback = process.env.ALLOW_DEV_DEFAULT_ADMIN === "true";
  const useDefaultDevAdmin =
    allowDevFallback && process.env.NODE_ENV === "development" && (!adminEmail || !adminPassword);

  return {
    adminEmail: adminEmail || (useDefaultDevAdmin ? defaultDevAdmin.email : ""),
    adminPassword: adminPassword || (useDefaultDevAdmin ? defaultDevAdmin.password : ""),
    adminName: adminName || (useDefaultDevAdmin ? defaultDevAdmin.name : "Store Admin"),
  };
}

export type AppUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
};

export class DuplicateUserError extends Error {
  constructor(message = "A user with this email already exists.") {
    super(message);
    this.name = "DuplicateUserError";
  }
}

type PasswordChangeResult =
  | { ok: true }
  | { ok: false; reason: "invalid-user" | "password-not-set" | "invalid-current-password" | "same-password" };

function toAppUser(doc: {
  _id: unknown;
  name: string;
  email: string;
  role: UserRole;
}) {
  return {
    id: String(doc._id),
    name: doc.name,
    email: doc.email,
    role: doc.role,
  } satisfies AppUser;
}

export async function findUserByEmail(email: string) {
  await connectToDatabase();
  const user = await UserModel.findOne({ email: email.toLowerCase() }).lean();

  if (!user) {
    return null;
  }

  return {
    ...toAppUser(user),
    passwordHash: user.passwordHash,
  };
}

export async function ensureAdminUserFromEnv() {
  const { adminEmail, adminPassword, adminName } = getAdminAuthConfig();

  if (!adminEmail || !adminPassword) {
    return null;
  }

  await connectToDatabase();

  const existing = await UserModel.findOne({ email: adminEmail });
  const passwordHash = await bcrypt.hash(adminPassword, 12);

  if (existing) {
    const hasPassword = Boolean(existing.passwordHash);
    const isAdmin = existing.role === "admin";
    let samePassword = false;

    if (hasPassword && existing.passwordHash) {
      samePassword = await bcrypt.compare(adminPassword, existing.passwordHash);
    }

    if (existing.name !== adminName || !isAdmin || !samePassword) {
      existing.name = adminName;
      existing.role = "admin";
      existing.passwordHash = passwordHash;
      await existing.save();
    }

    return toAppUser(existing);
  }

  const created = await UserModel.create({
    name: adminName,
    email: adminEmail,
    role: "admin",
    passwordHash,
  });

  return toAppUser(created);
}

export async function verifyUserCredentials(email: string, password: string) {
  const normalizedEmail = email.toLowerCase().trim();
  const { adminEmail, adminPassword, adminName } = getAdminAuthConfig();

  if (adminEmail && adminPassword && normalizedEmail === adminEmail && password === adminPassword) {
    try {
      const adminUser = await ensureAdminUserFromEnv();
      if (adminUser) {
        return adminUser;
      }
    } catch {
      // DB can be temporarily unavailable; still allow env-based admin access.
    }

    return {
      id: "env-admin",
      name: adminName,
      email: adminEmail,
      role: "admin",
    } satisfies AppUser;
  }

  await ensureAdminUserFromEnv();
  const user = await findUserByEmail(normalizedEmail);

  if (!user || !user.passwordHash) {
    return null;
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);

  if (!isMatch) {
    return null;
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  } satisfies AppUser;
}

export async function createCustomerUser(input: {
  name: string;
  email: string;
  password: string;
}) {
  await connectToDatabase();

  const normalizedEmail = input.email.trim().toLowerCase();
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();

  if (adminEmail && normalizedEmail === adminEmail) {
    throw new DuplicateUserError("This email is reserved for admin access.");
  }

  const existing = await UserModel.findOne({ email: normalizedEmail }).lean();

  if (existing) {
    throw new DuplicateUserError();
  }

  const passwordHash = await bcrypt.hash(input.password, 12);
  const created = await UserModel.create({
    name: input.name.trim(),
    email: normalizedEmail,
    passwordHash,
    role: "customer",
  });

  return {
    id: String(created._id),
    name: created.name,
    email: created.email,
    role: created.role,
  } satisfies AppUser;
}

export async function upsertOAuthCustomerUser(input: {
  name?: string | null;
  email: string;
}) {
  await connectToDatabase();

  const normalizedEmail = input.email.trim().toLowerCase();
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();

  if (adminEmail && normalizedEmail === adminEmail) {
    const adminUser = await UserModel.findOne({ email: normalizedEmail });

    if (adminUser) {
      return {
        id: String(adminUser._id),
        name: adminUser.name,
        email: adminUser.email,
        role: adminUser.role,
      } satisfies AppUser;
    }
  }

  const displayName = input.name?.trim() || "Customer";
  const existing = await UserModel.findOne({ email: normalizedEmail });

  if (existing) {
    if (!existing.name && displayName) {
      existing.name = displayName;
      await existing.save();
    }

    return {
      id: String(existing._id),
      name: existing.name,
      email: existing.email,
      role: existing.role,
    } satisfies AppUser;
  }

  const created = await UserModel.create({
    name: displayName,
    email: normalizedEmail,
    role: "customer",
  });

  return {
    id: String(created._id),
    name: created.name,
    email: created.email,
    role: created.role,
  } satisfies AppUser;
}

function createResetTokenHash(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function requestPasswordReset(email: string) {
  await connectToDatabase();

  const normalizedEmail = email.trim().toLowerCase();
  const user = await UserModel.findOne({ email: normalizedEmail });

  if (!user) {
    return { requested: false as const };
  }

  const token = randomBytes(32).toString("hex");
  user.resetPasswordTokenHash = createResetTokenHash(token);
  user.resetPasswordExpiresAt = new Date(Date.now() + 1000 * 60 * 30);
  await user.save();

  return {
    requested: true as const,
    token,
  };
}

export async function resetPasswordByToken(token: string, newPassword: string) {
  await connectToDatabase();

  const tokenHash = createResetTokenHash(token);
  const user = await UserModel.findOne({
    resetPasswordTokenHash: tokenHash,
    resetPasswordExpiresAt: { $gt: new Date() },
  });

  if (!user) {
    return false;
  }

  user.passwordHash = await bcrypt.hash(newPassword, 12);
  user.resetPasswordTokenHash = undefined;
  user.resetPasswordExpiresAt = undefined;
  await user.save();

  return true;
}

export async function changePasswordForUser(input: {
  userId: string;
  currentPassword: string;
  newPassword: string;
}): Promise<PasswordChangeResult> {
  if (!Types.ObjectId.isValid(input.userId)) {
    return { ok: false, reason: "invalid-user" };
  }

  await connectToDatabase();

  const user = await UserModel.findById(input.userId);

  if (!user) {
    return { ok: false, reason: "invalid-user" };
  }

  if (!user.passwordHash) {
    return { ok: false, reason: "password-not-set" };
  }

  const isCurrentMatch = await bcrypt.compare(input.currentPassword, user.passwordHash);
  if (!isCurrentMatch) {
    return { ok: false, reason: "invalid-current-password" };
  }

  const isSamePassword = await bcrypt.compare(input.newPassword, user.passwordHash);
  if (isSamePassword) {
    return { ok: false, reason: "same-password" };
  }

  user.passwordHash = await bcrypt.hash(input.newPassword, 12);
  user.resetPasswordTokenHash = undefined;
  user.resetPasswordExpiresAt = undefined;
  await user.save();

  return { ok: true };
}
