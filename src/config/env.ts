import { SignOptions } from "jsonwebtoken";

// server configuration variable
export const CORS_ORIGIN = process.env.CORS_ORIGIN;
export const PORT = process.env.PORT;

// database configuration variable
export const DATABASE_URL = process.env.DATABASE_URL;

// jwt and bcryptjs configuration variable
export const COOKIE_SECURE = process.env.COOKIE_SECURE;
export const COOKIE_SAME_SITE = process.env.COOKIE_SAME_SITE;
export const COOKIE_EXPIRES_DAYS = process.env.COOKIE_EXPIRES_DAYS;
export const BCRYPT_SALT_ROUNDS = process.env.BCRYPT_SALT_ROUNDS;
export const JWT_SECRET = process.env.JWT_SECRET!;
export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN as SignOptions["expiresIn"];

// email cofig
export const BREVO_API_KEY = process.env.BREVO_API_KEY!;
export const BREVO_FROM_EMAIL = process.env.BREVO_FROM_EMAIL!;
export const BREVO_FROM_NAME = process.env.BREVO_FROM_NAME!;
export const OTP_PEPPER = process.env.OTP_PEPPER!;

// OAuth and Frontend configuration
export const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";
export const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || "";
// OAuth must return to the frontend origin so the `/api` rewrite can preserve
// the HttpOnly cookie on that same origin.
const FRONTEND_ORIGIN = (CORS_ORIGIN || "").replace(/\/+$/, "");
export const GOOGLE_CALLBACK_URL =
  process.env.GOOGLE_CALLBACK_URL ||
  `${FRONTEND_ORIGIN}/api/auth/google/callback`;


if (!process.env.BREVO_API_KEY) {
  throw new Error(
    "BREVO_API_KEY is not configured",
  );
}

if (!process.env.BREVO_FROM_EMAIL) {
  throw new Error(
    "BREVO_FROM_EMAIL is not configured",
  );
}
