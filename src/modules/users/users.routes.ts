import express from "express";
import { verifyToken, authorize } from "../../middleware/auth.middleware";
import * as userController from "./users.controller";
const router = express.Router();


router.get(
  "/",
  verifyToken,
  authorize("users", "read"),
  userController.getUsers
);

router.get(
  "/me",
  verifyToken,
  userController.getMyProfile
);

router.get(
  "/assignable",
  verifyToken,
  userController.getAssignableUsers
);

router.get(
  "/invitations",
  verifyToken,
  userController.getPendingInvitations,
);

router.post(
  "/",
  verifyToken,
  authorize("users", "create"),
  userController.createUser
);



router.post(
  "/invitations/:id/resend",
  verifyToken,
  userController.resendInvitation,
);



router.get(
  "/:id",
  verifyToken,
  authorize("users", "read"),
  userController.getUser
);

router.patch(
  "/me",
  verifyToken,
  userController.updateMyProfile,
);

router.patch(
  "/:id",
  verifyToken,
  authorize("users", "update"),
  userController.updateUser
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

router.delete(
  "/invitations/:id",
  verifyToken,
  userController.cancelInvitation,
);

router.delete(
  "/:id",
  verifyToken,
  authorize("users", "delete"),
  userController.deleteUser
);


export default router;