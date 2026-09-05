"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorMiddleware = void 0;
const AppError_1 = require("../shared/errors/AppError");
const errorMiddleware = (error, req, res, next) => {
    console.error(error);
    const statusCode = error instanceof AppError_1.AppError
        ? error.statusCode
        : 500;
    res.status(statusCode).json({
        status: "error",
        message: error.message,
    });
};
exports.errorMiddleware = errorMiddleware;
