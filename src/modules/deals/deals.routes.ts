import express from "express";
import { assignDealsSchema } from "./deals.schema";

import {
  createDeal,
  getDeals,
  getDealById,
  updateDeal,
  updateDealStage,
  deleteDeal,
  assignDeals
} from "./deals.controller";

import {
  verifyToken,
  authorize,
} from "../../middleware/auth.middleware";

const router = express.Router();

router.use(verifyToken);

router.post(
  "/",
  authorize("deals", "create"),
  createDeal
);

router.get(
  "/",
  authorize("deals", "read"),
  getDeals
);

router.get(
  "/:id",
  authorize("deals", "read"),
  getDealById
);

router.patch(
  "/assign",
  authorize("deals", "assign"),
 assignDeals
);

router.patch(
  "/:id",
  authorize("deals", "update"),
  updateDeal
);

router.patch(
  "/:id/stage",
  authorize("deals", "update"),
  updateDealStage
);

router.delete(
  "/:id",
  authorize("deals", "delete"),
  deleteDeal
);

export default router;