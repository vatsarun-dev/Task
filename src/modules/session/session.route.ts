import { Router } from "express";
import SessionController from "./session.controller.js";
import asyncHandler from "../../utils/asyncHandler.js";
import {
  availableSessionsValidation,
  bookSessionValidation,
  completeSessionValidation,
  createSessionValidation,
} from "../../validation/session.validation.js";

const sessionRoutes: Router = Router();
const sessionController = new SessionController();

// API 2 - Create Session: POST /sessions
sessionRoutes.post(
  "/",
  createSessionValidation,
  asyncHandler(sessionController.createSession.bind(sessionController)),
);

// API 3 - Available Sessions for Booking: GET /sessions/available?dateTimestamp={timestamp}
sessionRoutes.get(
  "/available",
  availableSessionsValidation,
  asyncHandler(sessionController.getAvailableSessions.bind(sessionController)),
);

// API 4 - Book Session: POST /sessions/:id/book
sessionRoutes.post(
  "/:id/book",
  bookSessionValidation,
  asyncHandler(sessionController.bookSession.bind(sessionController)),
);

// API 5 - Mark Session Complete: PATCH /sessions/:id/complete
sessionRoutes.patch(
  "/:id/complete",
  completeSessionValidation,
  asyncHandler(sessionController.completeSession.bind(sessionController)),
);

export default sessionRoutes;
