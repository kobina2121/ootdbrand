import { connectToDatabase } from "@/lib/db/mongoose";
import { AdminNotificationModel } from "@/lib/db/models/admin-notification";

type NotificationType = "store-order" | "custom-order";

export async function createAdminNotification(input: {
  type: NotificationType;
  title: string;
  message: string;
  link: string;
  metadata?: Record<string, unknown>;
}) {
  try {
    await connectToDatabase();
    const created = await AdminNotificationModel.create({
      type: input.type,
      title: input.title,
      message: input.message,
      link: input.link,
      unread: true,
      metadata: input.metadata,
    });

    return {
      id: String(created._id),
    };
  } catch {
    return null;
  }
}

export async function listAdminNotifications(limit = 40) {
  try {
    await connectToDatabase();
    const docs = await AdminNotificationModel.find({})
      .sort({ createdAt: -1 })
      .limit(Math.max(1, Math.min(100, limit)))
      .lean();

    return docs.map((doc) => ({
      id: String(doc._id),
      type: doc.type,
      title: doc.title,
      message: doc.message,
      link: doc.link,
      unread: doc.unread,
      createdAt: doc.createdAt,
    }));
  } catch {
    return [];
  }
}

export async function getUnreadAdminNotificationCount() {
  try {
    await connectToDatabase();
    return await AdminNotificationModel.countDocuments({ unread: true });
  } catch {
    return 0;
  }
}

export async function markAllAdminNotificationsRead() {
  try {
    await connectToDatabase();
    await AdminNotificationModel.updateMany({ unread: true }, { $set: { unread: false } });
    return true;
  } catch {
    return false;
  }
}
