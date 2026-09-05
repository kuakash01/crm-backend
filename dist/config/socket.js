"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyTokenSocket = exports.getIO = exports.initializeSocket = void 0;
const socket_io_1 = require("socket.io");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("./env");
const db_1 = require("./db");
let io;
const initializeSocket = (httpServer) => {
    io = new socket_io_1.Server(httpServer, {
        cors: {
            origin: env_1.CORS_ORIGIN,
            credentials: true,
        },
    });
    io.use(async (socket, next) => {
        try {
            const cookieHeader = socket.handshake.headers.cookie;
            const token = getAccessTokenFromCookie(cookieHeader);
            if (!token) {
                return next(new Error("Unauthorized"));
            }
            const user = await (0, exports.verifyTokenSocket)(token);
            if (!user) {
                return next(new Error("Unauthorized"));
            }
            socket.data.user = user;
            next();
        }
        catch {
            next(new Error("Invalid authentication"));
        }
    });
    io.on("connection", (socket) => {
        const user = socket.data.user;
        console.log(`User ${user.id} connected: ${socket.id}`);
        socket.join(`user:${user.id}`);
        console.log(`User ${user.id} joined room user:${user.id}`);
        socket.on("disconnect", () => {
            console.log(`User ${user.id} disconnected: ${socket.id}`);
        });
    });
    return io;
};
exports.initializeSocket = initializeSocket;
const getIO = () => {
    if (!io) {
        throw new Error("Socket.IO has not been initialized");
    }
    return io;
};
exports.getIO = getIO;
const getAccessTokenFromCookie = (cookieHeader) => {
    if (!cookieHeader) {
        return null;
    }
    const cookies = cookieHeader
        .split(";")
        .map((cookie) => cookie.trim());
    const accessTokenCookie = cookies.find((cookie) => cookie.startsWith("accessToken="));
    if (!accessTokenCookie) {
        return null;
    }
    return decodeURIComponent(accessTokenCookie.substring("accessToken=".length));
};
const verifyTokenSocket = async (token) => {
    const decoded = jsonwebtoken_1.default.verify(token, env_1.JWT_SECRET);
    const user = await authenticateUserSocket(decoded.id);
    return user;
};
exports.verifyTokenSocket = verifyTokenSocket;
const authenticateUserSocket = async (userId) => {
    const result = await db_1.pool.query(`
    SELECT
      u.id,
      u.fullname,
      u.email,
      u.organization_id,
      u.role_id,
      r.name AS role
    FROM users u
    LEFT JOIN roles r
      ON r.id = u.role_id
    WHERE u.id = $1
      AND u.is_active = TRUE
    `, [userId]);
    if (!result.rows.length) {
        throw new Error("User no longer exists");
    }
    return result.rows[0];
};
