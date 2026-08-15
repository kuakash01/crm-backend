import { Router } from "express";

import {
  getAllNotifications,
  unreadNotificationCount,
  readNotification,
  readAllNotifications,
} from "./notification.controller";

import { verifyToken } from "../../middleware/auth.middleware";

const router = Router();

router.use(verifyToken);

router.get("/", getAllNotifications);

router.get(
  "/unread-count",
  unreadNotificationCount
);

router.patch(
  "/:id/read",
  readNotification
);

router.patch(
  "/read-all",
  readAllNotifications
);

export default router;