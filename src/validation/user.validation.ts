import { body, param, type ValidationChain } from "express-validator";
import type { RequestHandler } from "express";
import validRequest from "../utils/validRequest.js";

type MiddlewareItem = ValidationChain | RequestHandler;

export const createUserValidation: MiddlewareItem[] = [
  body("fullName")
    .trim()
    .notEmpty()
    .withMessage("fullName is required")
    .isLength({ min: 2, max: 100 })
    .withMessage("fullName must be between 2 and 100 characters"),
  body("email")
    .trim()
    .notEmpty()
    .withMessage("email is required")
    .isEmail()
    .withMessage("Please provide a valid email address")
    .toLowerCase(),
  body("phone")
    .trim()
    .notEmpty()
    .withMessage("phone is required")
    .matches(/^[+\d][\d\s\-()]{6,19}$/)
    .withMessage("Please provide a valid phone number"),
  validRequest,
];

export const userIdParamValidation: MiddlewareItem[] = [
  param("id").isMongoId().withMessage("Invalid user ID format"),
  validRequest,
];
