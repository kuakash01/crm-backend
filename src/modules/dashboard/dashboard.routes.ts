import { Router } from "express";

import { authorize, verifyToken } from "../../middleware/auth.middleware";

import { getDashboard } from "./dashboard.controller";

const router = Router();

router.get(
  "/",
  verifyToken,
  getDashboard
);

export default router;