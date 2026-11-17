import { Types, type PipelineStage } from "mongoose";
import SessionModel, { type SessionDocument } from "../models/session.model.js";
import TeacherModel from "../models/teacher.model.js";
import { SessionStatus } from "../constant/app.constant.js";

export interface CreateSessionPayload {
  teacherId: Types.ObjectId;
  startTime: Date;
  endTime: Date;
}

export interface SessionWithTeacher {
  _id: Types.ObjectId;
  teacherId: Types.ObjectId;
  userId: Types.ObjectId | null;
  startTime: Date;
  endTime: Date;
  status: string;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  teacher: {
    _id: Types.ObjectId;
    fullName: string;
    email: string;
    specialization: string;
    experience: number;
  } | null;
}

export interface UserSessionsAggregateResult {
  upcomingSessions: SessionWithTeacher[];
  completedSessions: SessionWithTeacher[];
}

export default class SessionRepository {
  async create(payload: CreateSessionPayload): Promise<SessionDocument> {
    return await SessionModel.create({
      teacherId: payload.teacherId,
      userId: null,
      startTime: payload.startTime,
      endTime: payload.endTime,
      status: SessionStatus.AVAILABLE,
      completedAt: null,
    });
  }

  async findById(id: string | Types.ObjectId): Promise<SessionDocument | null> {
    return await SessionModel.findById(id);
  }

  /**
   * API 3: Returns all AVAILABLE sessions for the given UTC day window
   * using MongoDB Aggregation Pipeline.
   */
  async findAvailableByDateRange(
    dayStart: Date,
    nextDayStart: Date,
  ): Promise<SessionWithTeacher[]> {
    const teacherCollection = TeacherModel.collection.name;

    const pipeline: PipelineStage[] = [
      {
        $match: {
          status: SessionStatus.AVAILABLE,
          startTime: {
            $gte: dayStart,
            $lt: nextDayStart,
          },
        },
      },
      {
        $lookup: {
          from: teacherCollection,
          localField: "teacherId",
          foreignField: "_id",
          as: "teacher",
        },
      },
      {
        $unwind: {
          path: "$teacher",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $sort: {
          startTime: 1,
        },
      },
      {
        $project: {
          _id: 1,
          teacherId: 1,
          userId: 1,
          startTime: 1,
          endTime: 1,
          status: 1,
          completedAt: 1,
          createdAt: 1,
          updatedAt: 1,
          teacher: {
            $cond: {
              if: { $ifNull: ["$teacher._id", false] },
              then: {
                _id: "$teacher._id",
                fullName: "$teacher.fullName",
                email: "$teacher.email",
                specialization: "$teacher.specialization",
                experience: "$teacher.experience",
              },
              else: null,
            },
          },
        },
      },
    ];

    return await SessionModel.aggregate<SessionWithTeacher>(pipeline);
  }

  /**
   * API 4: Atomically transitions an AVAILABLE session to BOOKED for the user.
   */
  async bookSessionAtomically(
    sessionId: string | Types.ObjectId,
    userId: string | Types.ObjectId,
  ): Promise<SessionDocument | null> {
    return await SessionModel.findOneAndUpdate(
      {
        _id: new Types.ObjectId(sessionId),
        status: SessionStatus.AVAILABLE,
      },
      {
        $set: {
          status: SessionStatus.BOOKED,
          userId: new Types.ObjectId(userId),
        },
      },
      {
        returnDocument: "after",
      },
    );
  }

  /**
   * API 5: Atomically transitions a BOOKED session to COMPLETED and sets completedAt.
   */
  async completeSessionAtomically(
    sessionId: string | Types.ObjectId,
    completedAt: Date,
  ): Promise<SessionDocument | null> {
    return await SessionModel.findOneAndUpdate(
      {
        _id: new Types.ObjectId(sessionId),
        status: SessionStatus.BOOKED,
      },
      {
        $set: {
          status: SessionStatus.COMPLETED,
          completedAt,
        },
      },
      {
        returnDocument: "after",
      },
    );
  }

  /**
   * API 6: Returns a user's sessions separated into upcomingSessions (BOOKED)
   * and completedSessions (COMPLETED) using MongoDB Aggregation Pipeline ($facet).
   */
  async findUserSessionsGrouped(
    userId: string | Types.ObjectId,
  ): Promise<UserSessionsAggregateResult> {
    const teacherCollection = TeacherModel.collection.name;

    const pipeline: PipelineStage[] = [
      {
        $match: {
          userId: new Types.ObjectId(userId),
        },
      },
      {
        $lookup: {
          from: teacherCollection,
          localField: "teacherId",
          foreignField: "_id",
          as: "teacher",
        },
      },
      {
        $unwind: {
          path: "$teacher",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          _id: 1,
          teacherId: 1,
          userId: 1,
          startTime: 1,
          endTime: 1,
          status: 1,
          completedAt: 1,
          createdAt: 1,
          updatedAt: 1,
          teacher: {
            $cond: {
              if: { $ifNull: ["$teacher._id", false] },
              then: {
                _id: "$teacher._id",
                fullName: "$teacher.fullName",
                email: "$teacher.email",
                specialization: "$teacher.specialization",
                experience: "$teacher.experience",
              },
              else: null,
            },
          },
        },
      },
      {
        $facet: {
          upcomingSessions: [
            { $match: { status: SessionStatus.BOOKED } },
            { $sort: { startTime: 1 } },
          ],
          completedSessions: [
            { $match: { status: SessionStatus.COMPLETED } },
            { $sort: { completedAt: -1, startTime: -1 } },
          ],
        },
      },
    ];

    const [result] =
      await SessionModel.aggregate<UserSessionsAggregateResult>(pipeline);

    return {
      upcomingSessions: result?.upcomingSessions ?? [],
      completedSessions: result?.completedSessions ?? [],
    };
  }
}
