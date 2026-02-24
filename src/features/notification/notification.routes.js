import { Router } from "express";
import { Authenticate } from "../../middlewares/authMiddleware.js";
import { validate } from "../../middlewares/validateMiddleware.js";
import { notificationIdSchema } from "./notification.validation.js";
import {
  getMyNotifications,
  markAllRead,
  markAsRead,
  deleteNotification,
} from "./notification.controller.js";

const router = Router();

// GET  /notifications/my         — all notifications for the caller
router.get("/my", Authenticate, getMyNotifications);

// PATCH /notifications/read-all  — mark every unread notification as read
// ⚠️ Must be declared BEFORE /:id routes to avoid "read-all" being treated as an :id param
router.patch("/read-all", Authenticate, markAllRead);

// PATCH /notifications/:id/read  — mark a single notification as read
router.patch(
  "/:id/read",
  Authenticate,
  validate(notificationIdSchema, "params"),
  markAsRead,
);

// DELETE /notifications/:id      — delete a single notification
router.delete(
  "/:id",
  Authenticate,
  validate(notificationIdSchema, "params"),
  deleteNotification,
);

export default router;
