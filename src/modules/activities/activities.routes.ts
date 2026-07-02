import express from "express";
import { getActivities } from "./activities.controller";
import { verifyToken } from "../../middleware/auth.middleware"
const router = express.Router();

router.use(verifyToken);

router.get("/:entityType/:entityId", getActivities)

export default router;