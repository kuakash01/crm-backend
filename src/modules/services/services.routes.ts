import express from "express";

import {
  createService,
  getServices,
  getServiceById,
  updateService,
  deleteService
} from "./services.controller";

import {
  verifyToken,
  authorize
} from "../../middleware/auth.middleware";

const router = express.Router();

router.use(verifyToken);

router.post(
  "/",
  authorize("services", "create"),
  createService
);

router.get(
  "/",
  authorize("services", "read"),
  getServices
);

router.get(
  "/:id",
  authorize("services", "read"),
  getServiceById
);

router.patch(
  "/:id",
  authorize("services", "update"),
  updateService
);

router.delete(
  "/:id",
  authorize("services", "delete"),
  deleteService
);

export default router;