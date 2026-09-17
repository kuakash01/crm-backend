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
  (req, res, next) => {
    const isActivating = Boolean(req.body?.isActive);
    const requiredAction = isActivating ? "activate" : "deactivate";
    const userPerms: string[] = req.user?.permissions || [];

    if (
      !userPerms.includes(`users:${requiredAction}`) &&
      !userPerms.includes("users:update")
    ) {
      return res.status(403).json({
        message: "Permission denied",
      });
    }

    next();
  },
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