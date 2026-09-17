import { Router } from "express";
import { authorize, verifyToken } from "../../middleware/auth.middleware";
import * as organizationController from "./organizations.controller";

const router = Router();

router.use(verifyToken);

router.get(
  "/me",
  authorize("organizations", "read"),
  organizationController.getMyOrganization
);

router.patch(
  "/me",
  authorize("organizations", "update"),
  organizationController.updateMyOrganization
);

router.post(
  "/regenerate-inbound-key",
  authorize("organizations", "update"),
  organizationController.regenerateInboundKey
);

export default router;
