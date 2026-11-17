import { body, param, query, type ValidationChain } from "express-validator";
import type { RequestHandler } from "express";
import validRequest from "../utils/validRequest.js";
import { parseDateInput } from "../utils/date.util.js";

type MiddlewareItem = ValidationChain | RequestHandler;

export const createSessionValidation: MiddlewareItem[] = [
  body("teacherId")
    .trim()
    .notEmpty()
    .withMessage("teacherId is required")
    .isMongoId()
    .withMessage("Invalid teacherId format"),
  body("startTime")
    .notEmpty()
    .withMessage("startTime is required")
    .custom((value) => {
      parseDateInput(value, "startTime");
      return true;
    }),
  body("endTime")
    .notEmpty()
    .withMessage("endTime is required")
    .custom((value, { req }) => {
      const end = parseDateInput(value, "endTime");
      if (req.body?.startTime !== undefined && req.body?.startTime !== "") {
        const start = parseDateInput(req.body.startTime, "startTime");
        if (end.getTime() <= start.getTime()) {
          throw new Error("endTime must be greater than startTime");
        }
      }
      return true;
    }),
  validRequest,
];

export const availableSessionsValidation: MiddlewareItem[] = [
  query("dateTimestamp")
    .notEmpty()
    .withMessage("dateTimestamp query parameter is required")
    .custom((value) => {
      parseDateInput(value, "dateTimestamp");
      return true;
    }),
  validRequest,
];

export const bookSessionValidation: MiddlewareItem[] = [
  param("id").isMongoId().withMessage("Invalid session ID format"),
  body("userId")
    .trim()
    .notEmpty()
    .withMessage("userId is required")
    .isMongoId()
    .withMessage("Invalid userId format"),
  validRequest,
];

export const completeSessionValidation: MiddlewareItem[] = [
  param("id").isMongoId().withMessage("Invalid session ID format"),
  validRequest,
];
