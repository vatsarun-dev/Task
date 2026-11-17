import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import SessionService, {
  type BookSessionDTO,
  type CreateSessionDTO,
} from "./session.service.js";

export default class SessionController {
  private readonly sessionService: SessionService;

  constructor() {
    this.sessionService = new SessionService();
  }

  async createSession(req: Request, res: Response): Promise<void> {
    const session = await this.sessionService.createSession(
      req.body as CreateSessionDTO,
    );

    res.status(StatusCodes.CREATED).json({
      success: true,
      message: "Session created successfully",
      data: session,
    });
  }

  async getAvailableSessions(req: Request, res: Response): Promise<void> {
    const { date, sessions } = await this.sessionService.getAvailableSessions(
      req.query.dateTimestamp,
    );

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Available sessions retrieved successfully",
      meta: {
        date,
        count: sessions.length,
      },
      data: sessions,
    });
  }

  async bookSession(req: Request, res: Response): Promise<void> {
    const sessionId = String(req.params.id);
    const session = await this.sessionService.bookSession(
      sessionId,
      req.body as BookSessionDTO,
    );

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Session booked successfully",
      data: session,
    });
  }

  async completeSession(req: Request, res: Response): Promise<void> {
    const sessionId = String(req.params.id);
    const session = await this.sessionService.completeSession(sessionId);

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Session marked as completed",
      data: session,
    });
  }
}
