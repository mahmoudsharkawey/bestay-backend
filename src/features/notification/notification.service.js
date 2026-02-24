import prisma from "../../prisma/client.js";
import AppError from "../../utils/AppError.js";

// Create a new notification (used internally by other services)
export function createNotification(userId, type, message, tx = prisma) {
  return tx.notification.create({
    data: {
      userId,
      type,
      message,
    },
  });
}

// GET all notifications for a user (newest first)
export async function getMyNotifications(userId) {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
}

// Mark a single notification as read (must belong to the user)
export async function markAsRead(notificationId, userId) {
  const notification = await prisma.notification.findUnique({
    where: { id: notificationId },
  });

  if (!notification) {
    throw new AppError("Notification not found", 404);
  }

  if (notification.userId !== userId) {
    throw new AppError(
      "You are not authorized to update this notification",
      403,
    );
  }

  return prisma.notification.update({
    where: { id: notificationId },
    data: { isRead: true },
  });
}

// Mark ALL unread notifications for a user as read
export async function markAllRead(userId) {
  const result = await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });

  return result; // { count: N }
}

// Delete a single notification (must belong to the user)
export async function deleteNotification(notificationId, userId) {
  const notification = await prisma.notification.findUnique({
    where: { id: notificationId },
  });

  if (!notification) {
    throw new AppError("Notification not found", 404);
  }

  if (notification.userId !== userId) {
    throw new AppError(
      "You are not authorized to delete this notification",
      403,
    );
  }

  return prisma.notification.delete({ where: { id: notificationId } });
}
