import type { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import mongoose from "mongoose";
import ApiError from "../shared/error/ApiError.js";
import logger from "../config/logger.js";
import env from "../config/env.js";

interface MongoDuplicateKeyError extends Error {
  code?: number;
  keyValue?: Record<string, unknown>;
}

interface JsonSyntaxError extends SyntaxError {
  status?: number;
  body?: unknown;
}

export default function errorHandler(
  err: Error | ApiError,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): Response {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      ...(err.details !== undefined ? { errors: err.details } : {}),
    });
  }

  // Handle malformed JSON request body
  const syntaxErr = err as JsonSyntaxError;
  if (err instanceof SyntaxError && syntaxErr.status === 400 && "body" in syntaxErr) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      message: "Malformed JSON payload",
    });
  }

  // Handle Mongoose validation errors
  if (err instanceof mongoose.Error.ValidationError) {
    const errors = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));

    return res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      message: "Validation failed",
      errors,
    });
  }

  // Handle Mongoose invalid ObjectId / cast errors
  if (err instanceof mongoose.Error.CastError) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      message: `Invalid ${err.path}: ${String(err.value)}`,
    });
  }

  // Handle MongoDB duplicate key errors (E11000)
  const mongoErr = err as MongoDuplicateKeyError;
  if (mongoErr.code === 11000) {
    const duplicateFields = mongoErr.keyValue
      ? Object.keys(mongoErr.keyValue).join(", ")
      : "field";

    return res.status(StatusCodes.CONFLICT).json({
      success: false,
      message: `Duplicate value for ${duplicateFields}`,
    });
  }

  logger.error({ err }, "Unhandled application error");

  return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
    success: false,
    message:
      env.NODE_ENV === "production"
        ? "Internal Server Error"
        : err.message || "Internal Server Error",
  });
}
