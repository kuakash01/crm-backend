"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
const auth_controller_1 = require("./auth.controller");
const auth_middleware_1 = require("../../middleware/auth.middleware");
router.post("/verify-email", auth_controller_1.verifyEmail);
router.post("/accept-invitation", auth_controller_1.acceptInvitation);
router.get("/invitation-details", auth_controller_1.getInvitationDetails);
router.post("/forgot-password", auth_controller_1.forgotPassword);
router.post("/reset-password", auth_controller_1.resetPassword);
router.post("/change-password", auth_middleware_1.verifyToken, auth_controller_1.changePassword);
router.post("/register", auth_controller_1.register);
router.post("/login", auth_controller_1.login);
// Passwordless Login with Email OTP
router.post("/otp/send", auth_controller_1.sendLoginOtp);
router.post("/otp/verify", auth_controller_1.verifyLoginOtp);
// Google OAuth 2.0
router.get("/google", auth_controller_1.googleAuthRedirect);
router.get("/google/callback", auth_controller_1.googleAuthCallback);
router.get("/logout", auth_controller_1.logout);
router.get("/me", auth_middleware_1.verifyToken, auth_controller_1.getCurrentUser);
router.get("/socket-token", auth_middleware_1.verifyToken, auth_controller_1.getSocketToken);
exports.default = router;
