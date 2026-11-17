import type { Request, Response, NextFunction } from "express";
import { validationResult, type ValidationError as ExpressValidationError } from "express-validator";
import { ValidationError } from "../shared/error/globalError.js";

export interface FormattedValidationError {
  field: string;
  message: string;
}

export default function validRequest(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  const result = validationResult(req);
  if (result.isEmpty()) {
    next();
    return;
  }

  const errors: FormattedValidationError[] = result
    .array()
    .map((err: ExpressValidationError) => ({
      field: "path" in err ? String(err.path) : "field",
      message: String(err.msg),
    }));

  next(new ValidationError("Validation failed", errors));
}
