import express from "express";
import {verifyToken, authorize} from "../../middleware/auth.middleware";
import * as userController from "./users.controller";
const router = express.Router();


router.get(
  "/",
  verifyToken,
  authorize("users", "read"),
  userController.getUsers
);
router.get(
  "/assignable",
  verifyToken,
  authorize("leads", "assign"),
  userController.getAssignableUsers
);
router.post(
  "/",
  verifyToken,
  authorize("users", "create"),
  userController.createUser
);

router.get(
  "/:id",
  verifyToken,
  authorize("users", "read"),
  userController.getUser
);


router.patch(
  "/:id",
  verifyToken,
  authorize("users", "update"),
  userController.updateUser
);

router.delete(
  "/:id",
  verifyToken,
  authorize("users", "delete"),
  userController.deleteUser
);

router.patch(
  "/:id/status",
  verifyToken,
  authorize("users", "deactivate"),
  userController.changeStatus
);

router.patch(
  "/:id/role",
  verifyToken,
  authorize("users", "update"),
  userController.changeRole
);



export default router;