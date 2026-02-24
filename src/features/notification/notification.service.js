import prisma from "../../prisma/client.js";

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
    const err = new Error("Notification not found");
    err.statusCode = 404;
    throw err;
  }

  if (notification.userId !== userId) {
    const err = new Error("You are not authorized to update this notification");
    err.statusCode = 403;
    throw err;
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
    const err = new Error("Notification not found");
    err.statusCode = 404;
    throw err;
  }

  if (notification.userId !== userId) {
    const err = new Error("You are not authorized to delete this notification");
    err.statusCode = 403;
    throw err;
  }

  return prisma.notification.delete({ where: { id: notificationId } });
}
