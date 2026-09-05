import express from "express";
const router = express.Router();
import { register, login, logout, getCurrentUser, verifyEmail, acceptInvitation, getInvitationDetails, forgotPassword, resetPassword, changePassword, getSocketToken } from "./auth.controller";
import { verifyToken } from "../../middleware/auth.middleware";

router.post(
  "/verify-email",
  verifyEmail,
);
router.post(
  "/accept-invitation",
  acceptInvitation,
);
router.get(
  "/invitation-details",
  getInvitationDetails,
);
router.post(
  "/forgot-password",
 forgotPassword,
);

router.post(
  "/reset-password",
  resetPassword,
);
router.post(
  "/change-password",
  verifyToken,
  changePassword,
);
router.post("/register", register);
router.post("/login", login);
router.get("/logout", logout);
router.get("/me", verifyToken, getCurrentUser);
router.get("/socket-token", verifyToken, getSocketToken);
export default router;