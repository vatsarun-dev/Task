import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import UserService, { type CreateUserDTO } from "./user.service.js";

export default class UserController {
  private readonly userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  async createUser(req: Request, res: Response): Promise<void> {
    const user = await this.userService.createUser(req.body as CreateUserDTO);

    res.status(StatusCodes.CREATED).json({
      success: true,
      message: "User created successfully",
      data: user,
    });
  }

  async listUsers(_req: Request, res: Response): Promise<void> {
    const users = await this.userService.listUsers();

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Users retrieved successfully",
      meta: {
        count: users.length,
      },
      data: users,
    });
  }

  async getUserSessions(req: Request, res: Response): Promise<void> {
    const userId = String(req.params.id);
    const sessions = await this.userService.getUserSessions(userId);

    res.status(StatusCodes.OK).json({
      success: true,
      message: "User sessions retrieved successfully",
      meta: {
        upcomingCount: sessions.upcomingSessions.length,
        completedCount: sessions.completedSessions.length,
      },
      data: sessions,
    });
  }
}
