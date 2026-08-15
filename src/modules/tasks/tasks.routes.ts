import express from "express";
const router = express.Router();
import { createTask, getTaskById, updateTask, updateTaskStatus, deleteTask, getAllTasks } from "./tasks.controller";
import { verifyToken, authorize } from "../../middleware/auth.middleware";

router.use(verifyToken);

// task routes
router.post(
  "/",
  authorize("tasks", "create"),
  createTask
);

router.get(
  "/",
  authorize("tasks", "read"),
  getAllTasks
);

router.get(
  "/:taskId",
  getTaskById
);



router.put(
  "/:taskId",
  updateTask
);

router.patch(
  "/:taskId/status",
  updateTaskStatus
);

router.delete(
  "/:taskId",
  deleteTask
);
export default router;