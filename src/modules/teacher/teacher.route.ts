import { Router } from "express";
import TeacherController from "./teacher.controller.js";
import asyncHandler from "../../utils/asyncHandler.js";
import { createTeacherValidation } from "../../validation/teacher.validation.js";

const teacherRoutes: Router = Router();
const teacherController = new TeacherController();

// Helper - Create Teacher: POST /teachers
teacherRoutes.post(
  "/",
  createTeacherValidation,
  asyncHandler(teacherController.createTeacher.bind(teacherController)),
);

// Helper - List Teachers: GET /teachers
teacherRoutes.get(
  "/",
  asyncHandler(teacherController.listTeachers.bind(teacherController)),
);

export default teacherRoutes;
