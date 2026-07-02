import { Router } from "express";

import * as rolesController from "./roles.controller";

import { verifyToken } from "../../middleware/auth.middleware";
import { authorize } from "../../middleware/auth.middleware"

const router = Router();

router.use(verifyToken);
router.use(authorize("roles", "manage_permissions"));

router.get(
  "/",
  rolesController.getRoles
);

router.post(
  "/",
  rolesController.createRole
);

router.patch(
  "/:id",
  rolesController.updateRole
);

router.delete(
  "/:id",
  rolesController.deleteRole
);

// Permissions
router.get(
  "/:id/permissions",
  rolesController.getRolePermissions
);

router.put(
  "/:id/permissions",
  rolesController.updateRolePermissions
);
export default router;