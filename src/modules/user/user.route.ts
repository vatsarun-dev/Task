import { Router } from "express";
import UserController from "./user.controller.js";
import asyncHandler from "../../utils/asyncHandler.js";
import {
  createUserValidation,
  userIdParamValidation,
} from "../../validation/user.validation.js";

const userRoutes: Router = Router();
const userController = new UserController();

// API 1 - Create User: POST /users
userRoutes.post(
  "/",
  createUserValidation,
  asyncHandler(userController.createUser.bind(userController)),
);

// Helper - List Users: GET /users
userRoutes.get(
  "/",
  asyncHandler(userController.listUsers.bind(userController)),
);

// API 6 - User Session List: GET /users/:id/sessions
userRoutes.get(
  "/:id/sessions",
  userIdParamValidation,
  asyncHandler(userController.getUserSessions.bind(userController)),
);

export default userRoutes;
