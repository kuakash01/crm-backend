"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const modules_1 = __importDefault(require("./modules"));
const error_middleware_1 = require("./middleware/error.middleware");
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const env_1 = require("./config/env");
const app = (0, express_1.default)();
// 1. Define your allowed domains
const allowedOrigins = [
    env_1.CORS_ORIGIN || 'http://localhost:3000', // Local development
    'http://127.0.0.1:3000',
];
// 2. Configure the dynamic check with proper TypeScript types
const corsOptions = {
    origin: (origin, callback) => {
        // Allow server-to-server requests or tools like Postman/cURL (where origin is undefined)
        if (!origin)
            return callback(null, true);
        if (allowedOrigins.includes(origin)) {
            callback(null, true); // Origin allowed
        }
        else {
            callback(new Error('Not allowed by CORS')); // Origin blocked
        }
    },
    credentials: true
};
app.use((0, cors_1.default)(corsOptions));
app.use(express_1.default.json());
app.use((0, cookie_parser_1.default)());
// Use the router for all routes
app.use("/api", modules_1.default);
// Global error handling middleware
app.use(error_middleware_1.errorMiddleware);
exports.default = app;
