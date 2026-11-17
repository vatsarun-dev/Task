import { StatusCodes } from "http-status-codes";
import ApiError from "./ApiError.js";

export class BadRequestError extends ApiError {
  constructor(message: string = "Bad Request", details?: unknown) {
    super(message, StatusCodes.BAD_REQUEST, details);
  }
}

export class NotFoundError extends ApiError {
  constructor(message: string = "Resource not found") {
    super(message, StatusCodes.NOT_FOUND);
  }
}

export class ConflictError extends ApiError {
  constructor(message: string = "Resource conflict") {
    super(message, StatusCodes.CONFLICT);
  }
}

export class ValidationError extends ApiError {
  constructor(message: string = "Validation failed", details?: unknown) {
    super(message, StatusCodes.BAD_REQUEST, details);
  }
}
