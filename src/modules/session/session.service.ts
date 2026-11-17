import { Types } from "mongoose";
import SessionRepository, {
  type SessionWithTeacher,
} from "../../repository/session.repo.js";
import TeacherRepository from "../../repository/teacher.repo.js";
import UserRepository from "../../repository/user.repo.js";
import type { SessionDocument } from "../../models/session.model.js";
import { SessionStatus } from "../../constant/app.constant.js";
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
} from "../../shared/error/globalError.js";
import { getUtcDayBounds, parseDateInput } from "../../utils/date.util.js";

export interface CreateSessionDTO {
  teacherId: string;
  startTime: string | number;
  endTime: string | number;
}

export interface BookSessionDTO {
  userId: string;
}

export interface AvailableSessionsResult {
  date: string;
  sessions: SessionWithTeacher[];
}

export default class SessionService {
  private readonly sessionRepo: SessionRepository;
  private readonly teacherRepo: TeacherRepository;
  private readonly userRepo: UserRepository;

  constructor() {
    this.sessionRepo = new SessionRepository();
    this.teacherRepo = new TeacherRepository();
    this.userRepo = new UserRepository();
  }

  async createSession(payload: CreateSessionDTO): Promise<SessionDocument> {
    const startTime = parseDateInput(payload.startTime, "startTime");
    const endTime = parseDateInput(payload.endTime, "endTime");

    if (endTime.getTime() <= startTime.getTime()) {
      throw new BadRequestError("endTime must be greater than startTime");
    }

    const teacher = await this.teacherRepo.findById(payload.teacherId);
    if (!teacher) {
      throw new NotFoundError("Teacher not found");
    }

    return await this.sessionRepo.create({
      teacherId: new Types.ObjectId(payload.teacherId),
      startTime,
      endTime,
    });
  }

  async getAvailableSessions(
    dateTimestamp: unknown,
  ): Promise<AvailableSessionsResult> {
    const parsedDate = parseDateInput(dateTimestamp, "dateTimestamp");
    const { dayStart, nextDayStart, isoDate } = getUtcDayBounds(parsedDate);

    const sessions = await this.sessionRepo.findAvailableByDateRange(
      dayStart,
      nextDayStart,
    );

    return {
      date: isoDate,
      sessions,
    };
  }

  async bookSession(
    sessionId: string,
    payload: BookSessionDTO,
  ): Promise<SessionDocument> {
    const user = await this.userRepo.findById(payload.userId);
    if (!user) {
      throw new NotFoundError("User not found");
    }

    const bookedSession = await this.sessionRepo.bookSessionAtomically(
      sessionId,
      payload.userId,
    );

    if (bookedSession) {
      return bookedSession;
    }

    const existingSession = await this.sessionRepo.findById(sessionId);
    if (!existingSession) {
      throw new NotFoundError("Session not found");
    }

    if (existingSession.status === SessionStatus.BOOKED) {
      throw new ConflictError("Session is already booked");
    }

    if (existingSession.status === SessionStatus.COMPLETED) {
      throw new ConflictError("Completed session cannot be booked");
    }

    throw new ConflictError("Only available sessions can be booked");
  }

  async completeSession(sessionId: string): Promise<SessionDocument> {
    const completedSession = await this.sessionRepo.completeSessionAtomically(
      sessionId,
      new Date(),
    );

    if (completedSession) {
      return completedSession;
    }

    const existingSession = await this.sessionRepo.findById(sessionId);
    if (!existingSession) {
      throw new NotFoundError("Session not found");
    }

    if (existingSession.status === SessionStatus.AVAILABLE) {
      throw new BadRequestError(
        "Only booked sessions can be marked as completed",
      );
    }

    if (existingSession.status === SessionStatus.COMPLETED) {
      throw new ConflictError("Session is already marked as completed");
    }

    throw new BadRequestError("Session cannot be marked as completed");
  }
}
