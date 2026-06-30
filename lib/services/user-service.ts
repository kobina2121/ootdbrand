import { createHash, randomBytes, randomInt } from "node:crypto";

import bcrypt from "bcryptjs";
import { Types } from "mongoose";

import { connectToDatabase } from "@/lib/db/mongoose";
import { UserModel, type UserRole } from "@/lib/db/models/user";

function getAdminBootstrapConfig() {
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase() || "";
  const adminPassword = process.env.ADMIN_PASSWORD || "";
  const adminName = process.env.ADMIN_NAME?.trim() || "Store Admin";

  return {
    adminEmail,
    adminPassword,
    adminName,
  };
}

export type AppUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
};

export class UnverifiedEmailError extends Error {
  constructor(message = "Verify your email address before logging in.") {
    super(message);
    this.name = "UnverifiedEmailError";
  }
}

export class DuplicateUserError extends Error {
  constructor(message = "A user with this email already exists.") {
    super(message);
    this.name = "DuplicateUserError";
  }
}

type PasswordChangeResult =
  | { ok: true }
  | { ok: false; reason: "invalid-user" | "password-not-set" | "invalid-current-password" | "same-password" };

type ProfileUpdateResult =
  | {
      ok: true;
      user: AppUser;
      emailChanged: boolean;
      pendingEmail?: string;
      verificationToken?: string;
      verificationCode?: string;
    }
  | { ok: false; reason: "invalid-user" | "duplicate-email" | "invalid-current-password" | "password-not-set" };

type EmailVerificationResult =
  | { ok: true; user: AppUser }
  | { ok: false; reason: "invalid-token" | "duplicate-email" };

type SignupVerificationResult =
  | { ok: true; user: AppUser }
  | { ok: false; reason: "invalid-code" };

type SignupCreateResult = {
  user: AppUser;
  verificationCode: string;
  alreadyPending: boolean;
};

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
    emailVerifiedAt: user.emailVerifiedAt,
    signupVerificationCodeHash: user.signupVerificationCodeHash,
  };
}

export async function ensureAdminUserBootstrap() {
  const { adminEmail, adminPassword, adminName } = getAdminBootstrapConfig();

  if (!adminEmail || !adminPassword) {
    return null;
  }

  await connectToDatabase();

  const passwordHash = await bcrypt.hash(adminPassword, 12);
  const configuredAdmin = await UserModel.findOne({ email: adminEmail });

  if (configuredAdmin) {
    configuredAdmin.name = configuredAdmin.name || adminName;
    configuredAdmin.role = "admin";
    configuredAdmin.passwordHash = passwordHash;
    configuredAdmin.emailVerifiedAt = configuredAdmin.emailVerifiedAt ?? new Date();
    await configuredAdmin.save();
    return toAppUser(configuredAdmin);
  }

  const created = await UserModel.create({
    name: adminName,
    email: adminEmail,
    role: "admin",
    passwordHash,
    emailVerifiedAt: new Date(),
  });

  return toAppUser(created);
}

export async function verifyUserCredentials(email: string, password: string) {
  const normalizedEmail = email.toLowerCase().trim();

  await ensureAdminUserBootstrap();
  const user = await findUserByEmail(normalizedEmail);

  if (!user || !user.passwordHash) {
    return null;
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);

  if (!isMatch) {
    return null;
  }

  if (user.role === "customer" && !user.emailVerifiedAt && user.signupVerificationCodeHash) {
    throw new UnverifiedEmailError();
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  } satisfies AppUser;
}

function createVerificationCode() {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

export async function createCustomerUser(input: {
  name: string;
  email: string;
  password: string;
}): Promise<SignupCreateResult> {
  await connectToDatabase();
  await ensureAdminUserBootstrap();

  const normalizedEmail = input.email.trim().toLowerCase();
  const trimmedName = input.name.trim();
  const existing = await UserModel.findOne({ email: normalizedEmail });

  const verificationCode = createVerificationCode();
  const verificationCodeHash = createResetTokenHash(verificationCode);
  const verificationExpiresAt = new Date(Date.now() + 1000 * 60 * 30);

  const passwordHash = await bcrypt.hash(input.password, 12);

  if (existing) {
    if (existing.role === "admin" || existing.emailVerifiedAt || !existing.signupVerificationCodeHash) {
      throw new DuplicateUserError();
    }

    existing.name = trimmedName;
    existing.passwordHash = passwordHash;
    existing.role = "customer";
    existing.signupVerificationCodeHash = verificationCodeHash;
    existing.signupVerificationExpiresAt = verificationExpiresAt;
    await existing.save();

    return {
      user: toAppUser(existing),
      verificationCode,
      alreadyPending: true,
    };
  }

  const created = await UserModel.create({
    name: trimmedName,
    email: normalizedEmail,
    passwordHash,
    role: "customer",
    signupVerificationCodeHash: verificationCodeHash,
    signupVerificationExpiresAt: verificationExpiresAt,
  });

  return {
    user: toAppUser(created),
    verificationCode,
    alreadyPending: false,
  };
}

export async function upsertOAuthCustomerUser(input: {
  name?: string | null;
  email: string;
}) {
  await connectToDatabase();
  await ensureAdminUserBootstrap();

  const normalizedEmail = input.email.trim().toLowerCase();
  const existingAdmin = await UserModel.findOne({ email: normalizedEmail, role: "admin" });

  if (existingAdmin) {
    return {
      id: String(existingAdmin._id),
      name: existingAdmin.name,
      email: existingAdmin.email,
      role: existingAdmin.role,
    } satisfies AppUser;
  }

  const displayName = input.name?.trim() || "Customer";
  const existing = await UserModel.findOne({ email: normalizedEmail });

  if (existing) {
    if (!existing.name && displayName) {
      existing.name = displayName;
    }

    existing.emailVerifiedAt = existing.emailVerifiedAt ?? new Date();
    existing.signupVerificationCodeHash = undefined;
    existing.signupVerificationExpiresAt = undefined;
    await existing.save();

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
    emailVerifiedAt: new Date(),
    signupVerificationCodeHash: undefined,
    signupVerificationExpiresAt: undefined,
  });

  return {
    id: String(created._id),
    name: created.name,
    email: created.email,
    role: created.role,
  } satisfies AppUser;
}

export async function verifySignupCode(input: { email: string; code: string }): Promise<SignupVerificationResult> {
  await connectToDatabase();

  const normalizedEmail = input.email.trim().toLowerCase();
  const codeHash = createResetTokenHash(input.code.trim());
  const user = await UserModel.findOne({
    email: normalizedEmail,
    signupVerificationCodeHash: codeHash,
    signupVerificationExpiresAt: { $gt: new Date() },
  });

  if (!user) {
    return { ok: false, reason: "invalid-code" };
  }

  user.emailVerifiedAt = new Date();
  user.signupVerificationCodeHash = undefined;
  user.signupVerificationExpiresAt = undefined;
  await user.save();

  return {
    ok: true,
    user: toAppUser(user),
  };
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

export async function updateProfileForUser(input: {
  userId: string;
  name: string;
  email: string;
  currentPassword?: string;
}): Promise<ProfileUpdateResult> {
  if (!Types.ObjectId.isValid(input.userId)) {
    return { ok: false, reason: "invalid-user" };
  }

  await connectToDatabase();

  const user = await UserModel.findById(input.userId);

  if (!user) {
    return { ok: false, reason: "invalid-user" };
  }

  const normalizedEmail = input.email.trim().toLowerCase();
  const trimmedName = input.name.trim();

  user.name = trimmedName;

  if (user.email === normalizedEmail) {
    await user.save();

    return {
      ok: true,
      user: {
        id: String(user._id),
        name: user.name,
        email: user.email,
        role: user.role,
      },
      emailChanged: false,
      pendingEmail: user.pendingEmail ?? undefined,
    };
  }

  if (!user.passwordHash) {
    return { ok: false, reason: "password-not-set" };
  }

  if (!input.currentPassword) {
    return { ok: false, reason: "invalid-current-password" };
  }

  const isCurrentMatch = await bcrypt.compare(input.currentPassword, user.passwordHash);
  if (!isCurrentMatch) {
    return { ok: false, reason: "invalid-current-password" };
  }

  const duplicate = await UserModel.findOne({
    _id: { $ne: user._id },
    $or: [{ email: normalizedEmail }, { pendingEmail: normalizedEmail }],
  }).lean();

  if (duplicate) {
    return { ok: false, reason: "duplicate-email" };
  }

  const verificationToken = randomBytes(32).toString("hex");
  const verificationCode = createVerificationCode();
  user.pendingEmail = normalizedEmail;
  user.pendingEmailChangeCodeHash = createResetTokenHash(verificationCode);
  user.pendingEmailChangeCodeExpiresAt = new Date(Date.now() + 1000 * 60 * 30);
  user.pendingEmailChangeTokenHash = createResetTokenHash(verificationToken);
  user.pendingEmailChangeExpiresAt = new Date(Date.now() + 1000 * 60 * 30);
  await user.save();

  return {
    ok: true,
    user: {
      id: String(user._id),
      name: user.name,
      email: user.email,
      role: user.role,
    },
    emailChanged: false,
    pendingEmail: user.pendingEmail,
    verificationToken,
    verificationCode,
  };
}

export async function verifyEmailChangeByCode(input: {
  userId: string;
  code: string;
}): Promise<EmailVerificationResult> {
  if (!Types.ObjectId.isValid(input.userId)) {
    return { ok: false, reason: "invalid-token" };
  }

  await connectToDatabase();

  const codeHash = createResetTokenHash(input.code.trim());
  const user = await UserModel.findOne({
    _id: new Types.ObjectId(input.userId),
    pendingEmailChangeCodeHash: codeHash,
    pendingEmailChangeCodeExpiresAt: { $gt: new Date() },
  });

  if (!user || !user.pendingEmail) {
    return { ok: false, reason: "invalid-token" };
  }

  const duplicate = await UserModel.findOne({
    _id: { $ne: user._id },
    $or: [{ email: user.pendingEmail }, { pendingEmail: user.pendingEmail }],
  }).lean();

  if (duplicate) {
    return { ok: false, reason: "duplicate-email" };
  }

  user.email = user.pendingEmail;
  user.emailVerifiedAt = new Date();
  user.pendingEmail = undefined;
  user.pendingEmailChangeCodeHash = undefined;
  user.pendingEmailChangeCodeExpiresAt = undefined;
  user.pendingEmailChangeTokenHash = undefined;
  user.pendingEmailChangeExpiresAt = undefined;
  await user.save();

  return {
    ok: true,
    user: toAppUser(user),
  };
}

export async function verifyEmailChangeByToken(token: string): Promise<EmailVerificationResult> {
  await connectToDatabase();

  const tokenHash = createResetTokenHash(token);
  const user = await UserModel.findOne({
    pendingEmailChangeTokenHash: tokenHash,
    pendingEmailChangeExpiresAt: { $gt: new Date() },
  });

  if (!user || !user.pendingEmail) {
    return { ok: false, reason: "invalid-token" };
  }

  const duplicate = await UserModel.findOne({
    _id: { $ne: user._id },
    $or: [{ email: user.pendingEmail }, { pendingEmail: user.pendingEmail }],
  }).lean();

  if (duplicate) {
    return { ok: false, reason: "duplicate-email" };
  }

  user.email = user.pendingEmail;
  user.emailVerifiedAt = new Date();
  user.pendingEmail = undefined;
  user.pendingEmailChangeCodeHash = undefined;
  user.pendingEmailChangeCodeExpiresAt = undefined;
  user.pendingEmailChangeTokenHash = undefined;
  user.pendingEmailChangeExpiresAt = undefined;
  await user.save();

  return {
    ok: true,
    user: {
      id: String(user._id),
      name: user.name,
      email: user.email,
      role: user.role,
    },
  };
}

export async function getAccountSettingsByUserId(userId: string) {
  if (!Types.ObjectId.isValid(userId)) {
    return null;
  }

  await connectToDatabase();
  const user = await UserModel.findById(userId).lean();

  if (!user) {
    return null;
  }

  return {
    ...toAppUser(user),
    pendingEmail: user.pendingEmail ?? null,
  };
}
