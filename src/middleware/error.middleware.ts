import { Request, Response, NextFunction } from "express";
import { AppError } from "../shared/errors/AppError";

export const errorMiddleware = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error(error);

  const statusCode =
    error instanceof AppError
      ? error.statusCode
      : 500;

  res.status(statusCode).json({
    status: "error",
    message: error.message,
  });
};