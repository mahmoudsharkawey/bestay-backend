import httpResponse from "../utils/httpResponse.js";
import httpError from "../utils/httpError.js";
import * as notificationService from "../services/notificationService.js";

// GET /notifications/my
export async function getMyNotifications(req, res, next) {
  try {
    const notifications = await notificationService.getMyNotifications(
      req.user.id,
    );
    httpResponse(
      req,
      res,
      200,
      "Notifications fetched successfully",
      notifications,
    );
  } catch (error) {
    httpError(next, error, req, error.statusCode || 500);
  }
}

// PATCH /notifications/read-all
export async function markAllRead(req, res, next) {
  try {
    const result = await notificationService.markAllRead(req.user.id);
    httpResponse(
      req,
      res,
      200,
      `${result.count} notification(s) marked as read`,
      result,
    );
  } catch (error) {
    httpError(next, error, req, error.statusCode || 500);
  }
}

// PATCH /notifications/:id/read
export async function markAsRead(req, res, next) {
  try {
    const notification = await notificationService.markAsRead(
      req.params.id,
      req.user.id,
    );
    httpResponse(req, res, 200, "Notification marked as read", notification);
  } catch (error) {
    httpError(next, error, req, error.statusCode || 500);
  }
}

// DELETE /notifications/:id
export async function deleteNotification(req, res, next) {
  try {
    await notificationService.deleteNotification(req.params.id, req.user.id);
    httpResponse(req, res, 200, "Notification deleted successfully");
  } catch (error) {
    httpError(next, error, req, error.statusCode || 500);
  }
}
