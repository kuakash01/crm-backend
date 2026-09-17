import express from "express";
import { getActivities, createActivity } from "./activities.controller";
import { verifyToken } from "../../middleware/auth.middleware";
const router = express.Router();

router.use(verifyToken);

router.get("/:entityType/:entityId", getActivities);
router.post("/:entityType/:entityId", createActivity);

export default router;