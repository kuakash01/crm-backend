import express from "express";
const router = express.Router();
import { createTask, getTasks, updateTask, updateTaskStatus, deleteTask } from "./tasks.controller";
import { verifyToken, authorize } from "../../middleware/auth.middleware";

router.use(verifyToken);

// task routes
router.post("/:entityType/:entityId", authorize("tasks", "create"), createTask);

router.get("/:entityType/:entityId", authorize("tasks", "read"), getTasks);

router.patch(
  "/:entityType/:entityId/:taskId",
  authorize("tasks", "upudate"),
  updateTask
);

router.patch(
  "/:entityType/:entityId/:taskId/status",
  authorize("tasks", "complete"),
  updateTaskStatus
);

router.delete(
  "/:entityType/:entityId/:taskId",
  authorize("tasks", "delete"),
  deleteTask
);
export default router;