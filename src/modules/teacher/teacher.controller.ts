import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import TeacherService, { type CreateTeacherDTO } from "./teacher.service.js";

export default class TeacherController {
  private readonly teacherService: TeacherService;

  constructor() {
    this.teacherService = new TeacherService();
  }

  async createTeacher(req: Request, res: Response): Promise<void> {
    const teacher = await this.teacherService.createTeacher(
      req.body as CreateTeacherDTO,
    );

    res.status(StatusCodes.CREATED).json({
      success: true,
      message: "Teacher created successfully",
      data: teacher,
    });
  }

  async listTeachers(_req: Request, res: Response): Promise<void> {
    const teachers = await this.teacherService.listTeachers();

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Teachers retrieved successfully",
      meta: {
        count: teachers.length,
      },
      data: teachers,
    });
  }
}
