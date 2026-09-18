"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.googleAuthCallback = exports.googleAuthRedirect = exports.verifyLoginOtp = exports.sendLoginOtp = exports.getSocketToken = exports.changePassword = exports.resetPassword = exports.forgotPassword = exports.acceptInvitation = exports.getInvitationDetails = exports.getCurrentUser = exports.logout = exports.login = exports.register = exports.verifyEmail = void 0;
const authService = __importStar(require("./auth.service"));
const env_1 = require("../../config/env");
const AppError_1 = require("../../shared/errors/AppError");
const verifyEmail = async (req, res) => {
    try {
        const { email, otp } = req.body;
        const result = await authService.verifyEmail(email, otp);
        res.cookie("accessToken", result.token, {
            httpOnly: true,
            secure: env_1.COOKIE_SECURE === "true",
            sameSite: env_1.COOKIE_SAME_SITE,
            maxAge: Number(env_1.COOKIE_EXPIRES_DAYS) *
                24 *
                60 *
                60 *
                1000,
        });
        return res.status(200).json({
            success: true,
            message: "Email verified successfully",
            data: {
                user: result.user,
            },
        });
    }
    catch (error) {
        if (error instanceof AppError_1.AppError) {
            return res.status(error.statusCode).json({
                success: false,
                message: error.message,
            });
        }
        console.error("Error in verifyEmail controller:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to verify email",
        });
    }
};
exports.verifyEmail = verifyEmail;
const register = async (req, res, next) => {
    try {
        const user = await authService.register(req.body);
        res.status(201).json({ status: "success", message: "User registered successfully", data: user });
    }
    catch (error) {
        next(error);
    }
};
exports.register = register;
const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const user = await authService.login(email, password);
        res.cookie("accessToken", user.token, {
            httpOnly: true,
            secure: env_1.COOKIE_SECURE === "true",
            sameSite: env_1.COOKIE_SAME_SITE,
            maxAge: Number(env_1.COOKIE_EXPIRES_DAYS) *
                24 *
                60 *
                60 *
                1000,
        });
        return res.status(200).json({
            status: "success",
            message: "Login successful",
        });
    }
    catch (error) {
        next(error);
    }
};
exports.login = login;
const logout = async (req, res) => {
    try {
        res.clearCookie("accessToken", {
            httpOnly: true,
            secure: env_1.COOKIE_SECURE === "true",
            sameSite: env_1.COOKIE_SAME_SITE,
        });
        return res.status(200).json({
            success: true,
            message: "Logged out successfully",
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to logout",
        });
    }
};
exports.logout = logout;
const getCurrentUser = async (req, res, next) => {
    try {
        const user = await authService.getCurrentUser(req.user.id);
        res.status(200).json({
            status: "success",
            data: user,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getCurrentUser = getCurrentUser;
const getInvitationDetails = async (req, res, next) => {
    try {
        const { token } = req.query;
        if (typeof token !== "string" ||
            !token) {
            throw new AppError_1.AppError("Invalid invitation token", 400);
        }
        const invitation = await authService.getInvitationDetails(token);
        return res.status(200).json({
            status: "success",
            data: invitation,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getInvitationDetails = getInvitationDetails;
const acceptInvitation = async (req, res, next) => {
    try {
        const { token, password } = req.body;
        const result = await authService.acceptInvitation(token, password);
        res.cookie("accessToken", result.token, {
            httpOnly: true,
            secure: env_1.COOKIE_SECURE === "true",
            sameSite: env_1.COOKIE_SAME_SITE,
            maxAge: Number(env_1.COOKIE_EXPIRES_DAYS) *
                24 *
                60 *
                60 *
                1000,
        });
        return res.status(200).json({
            status: "success",
            message: "Invitation accepted successfully",
            data: {
                user: result.user,
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.acceptInvitation = acceptInvitation;
const forgotPassword = async (req, res, next) => {
    try {
        const { email } = req.body;
        await authService.forgotPassword(email);
        return res.status(200).json({
            status: "success",
            message: "If an account exists for this email, a verification code has been sent.",
        });
    }
    catch (error) {
        next(error);
    }
};
exports.forgotPassword = forgotPassword;
const resetPassword = async (req, res, next) => {
    try {
        const { email, otp, newPassword, } = req.body;
        await authService.resetPassword(email, otp, newPassword);
        return res.status(200).json({
            status: "success",
            message: "Password reset successfully. You can now sign in.",
        });
    }
    catch (error) {
        next(error);
    }
};
exports.resetPassword = resetPassword;
const changePassword = async (req, res, next) => {
    try {
        const { currentPassword, newPassword, } = req.body;
        await authService.changePassword(req.user.id, currentPassword, newPassword);
        return res.status(200).json({
            status: "success",
            message: "Password changed successfully",
        });
    }
    catch (error) {
        next(error);
    }
};
exports.changePassword = changePassword;
const getSocketToken = async (req, res) => {
    try {
        const token = req.cookies?.accessToken;
        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized",
            });
        }
        return res.status(200).json({
            success: true,
            token,
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to get socket token",
        });
    }
};
exports.getSocketToken = getSocketToken;
const sendLoginOtp = async (req, res, next) => {
    try {
        const { email } = req.body;
        const result = await authService.sendLoginOtp(email);
        return res.status(200).json({
            status: "success",
            message: result.message,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.sendLoginOtp = sendLoginOtp;
const verifyLoginOtp = async (req, res, next) => {
    try {
        const { email, otp } = req.body;
        const result = await authService.verifyLoginOtp(email, otp);
        res.cookie("accessToken", result.token, {
            httpOnly: true,
            secure: env_1.COOKIE_SECURE === "true",
            sameSite: env_1.COOKIE_SAME_SITE,
            maxAge: Number(env_1.COOKIE_EXPIRES_DAYS) *
                24 *
                60 *
                60 *
                1000,
        });
        return res.status(200).json({
            status: "success",
            message: "Login successful",
            data: {
                user: result.user,
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.verifyLoginOtp = verifyLoginOtp;
const googleAuthRedirect = async (req, res, next) => {
    try {
        if (!env_1.GOOGLE_CLIENT_ID) {
            const loginUrl = new URL(`${env_1.CORS_ORIGIN}/login`);
            loginUrl.searchParams.set("error", "Google OAuth is not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in backend/.env");
            return res.redirect(loginUrl.toString());
        }
        const rootUrl = "https://accounts.google.com/o/oauth2/v2/auth";
        const options = {
            redirect_uri: env_1.GOOGLE_CALLBACK_URL,
            client_id: env_1.GOOGLE_CLIENT_ID,
            access_type: "offline",
            response_type: "code",
            prompt: "consent",
            scope: [
                "https://www.googleapis.com/auth/userinfo.profile",
                "https://www.googleapis.com/auth/userinfo.email",
            ].join(" "),
        };
        const qs = new URLSearchParams(options);
        return res.redirect(`${rootUrl}?${qs.toString()}`);
    }
    catch (error) {
        next(error);
    }
};
exports.googleAuthRedirect = googleAuthRedirect;
const googleAuthCallback = async (req, res) => {
    try {
        const code = req.query.code;
        const error = req.query.error;
        if (error || !code) {
            const loginUrl = new URL(`${env_1.CORS_ORIGIN}/login`);
            loginUrl.searchParams.set("error", error
                ? `Google login cancelled: ${error}`
                : "Missing authorization code from Google");
            return res.redirect(loginUrl.toString());
        }
        const result = await authService.handleGoogleOAuth(code);
        res.cookie("accessToken", result.token, {
            httpOnly: true,
            secure: env_1.COOKIE_SECURE === "true",
            sameSite: env_1.COOKIE_SAME_SITE,
            maxAge: Number(env_1.COOKIE_EXPIRES_DAYS) *
                24 *
                60 *
                60 *
                1000,
        });
        return res.redirect(`${env_1.CORS_ORIGIN}/dashboard`);
    }
    catch (err) {
        console.error("Google Auth Callback Error:", err);
        const loginUrl = new URL(`${env_1.CORS_ORIGIN}/login`);
        loginUrl.searchParams.set("error", err?.message || "Failed to complete Google authentication");
        return res.redirect(loginUrl.toString());
    }
};
exports.googleAuthCallback = googleAuthCallback;
