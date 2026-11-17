import { body, type ValidationChain } from "express-validator";
import type { RequestHandler } from "express";
import validRequest from "../utils/validRequest.js";

type MiddlewareItem = ValidationChain | RequestHandler;

export const createTeacherValidation: MiddlewareItem[] = [
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
  body("specialization")
    .trim()
    .notEmpty()
    .withMessage("specialization is required")
    .isLength({ min: 2, max: 100 })
    .withMessage("specialization must be between 2 and 100 characters"),
  body("experience")
    .notEmpty()
    .withMessage("experience is required")
    .isFloat({ min: 0, max: 80 })
    .withMessage("experience must be a non-negative number")
    .toFloat(),
  validRequest,
];
