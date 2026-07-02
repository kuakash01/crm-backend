import { SignOptions } from "jsonwebtoken";

// server configuration variable
export const CORS_ORIGIN = process.env.CORS_ORIGIN;
export const PORT = process.env.PORT;

// database configuration variable
export const DB_USER = process.env.DB_USER!;
export const DB_PASSWORD = process.env.DB_PASSWORD!;
export const DB_HOST = process.env.DB_HOST!;
export const DB_PORT = Number(process.env.DB_PORT!);
export const DB_NAME = process.env.DB_NAME!;

// jwt and bcryptjs configuration variable
export const NODE_ENV = process.env.NODE_ENV;
export const COOKIE_EXPIRES_DAYS = process.env.COOKIE_EXPIRES_DAYS;
export const BCRYPT_SALT_ROUNDS = process.env.BCRYPT_SALT_ROUNDS;
export const JWT_SECRET = process.env.JWT_SECRET!;
export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN as SignOptions["expiresIn"];
