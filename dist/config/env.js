"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GOOGLE_CALLBACK_URL = exports.GOOGLE_CLIENT_SECRET = exports.GOOGLE_CLIENT_ID = exports.OTP_PEPPER = exports.BREVO_FROM_NAME = exports.BREVO_FROM_EMAIL = exports.BREVO_API_KEY = exports.JWT_EXPIRES_IN = exports.JWT_SECRET = exports.BCRYPT_SALT_ROUNDS = exports.COOKIE_EXPIRES_DAYS = exports.COOKIE_SAME_SITE = exports.COOKIE_SECURE = exports.DATABASE_URL = exports.PORT = exports.CORS_ORIGIN = void 0;
// server configuration variable
exports.CORS_ORIGIN = process.env.CORS_ORIGIN;
exports.PORT = process.env.PORT;
// database configuration variable
exports.DATABASE_URL = process.env.DATABASE_URL;
// jwt and bcryptjs configuration variable
exports.COOKIE_SECURE = process.env.COOKIE_SECURE;
exports.COOKIE_SAME_SITE = process.env.COOKIE_SAME_SITE;
exports.COOKIE_EXPIRES_DAYS = process.env.COOKIE_EXPIRES_DAYS;
exports.BCRYPT_SALT_ROUNDS = process.env.BCRYPT_SALT_ROUNDS;
exports.JWT_SECRET = process.env.JWT_SECRET;
exports.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN;
// email cofig
exports.BREVO_API_KEY = process.env.BREVO_API_KEY;
exports.BREVO_FROM_EMAIL = process.env.BREVO_FROM_EMAIL;
exports.BREVO_FROM_NAME = process.env.BREVO_FROM_NAME;
exports.OTP_PEPPER = process.env.OTP_PEPPER;
// OAuth and Frontend configuration
exports.GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";
exports.GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || "";
// OAuth must return to the frontend origin so the `/api` rewrite can preserve
// the HttpOnly cookie on that same origin.
const FRONTEND_ORIGIN = (exports.CORS_ORIGIN || "").replace(/\/+$/, "");
exports.GOOGLE_CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL ||
    `${FRONTEND_ORIGIN}/api/auth/google/callback`;
if (!process.env.BREVO_API_KEY) {
    throw new Error("BREVO_API_KEY is not configured");
}
if (!process.env.BREVO_FROM_EMAIL) {
    throw new Error("BREVO_FROM_EMAIL is not configured");
}
