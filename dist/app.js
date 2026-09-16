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
const corsOptions = {
    origin: (origin, callback) => {
        // Allow server-to-server requests, Postman, cURL, etc.
        if (!origin)
            return callback(null, true);
        if (origin === env_1.CORS_ORIGIN) {
            callback(null, true);
        }
        else {
            callback(new Error("Not allowed by CORS"));
        }
    },
    credentials: true,
};
app.use((0, cors_1.default)(corsOptions));
app.use(express_1.default.json());
app.use((0, cookie_parser_1.default)());
app.use("/api", modules_1.default);
app.use(error_middleware_1.errorMiddleware);
exports.default = app;
