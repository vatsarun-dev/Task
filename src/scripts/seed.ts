import { connectDB, disconnectDB } from "../database/db.js";
import logger from "../config/logger.js";
import TeacherModel from "../models/teacher.model.js";
import UserModel from "../models/user.model.js";
import SessionModel from "../models/session.model.js";
import { SessionStatus } from "../constant/app.constant.js";

async function seed(): Promise<void> {
  try {
    await connectDB();

    const teachers = await Promise.all([
      TeacherModel.findOneAndUpdate(
        { email: "ananya.sharma@platform.edu" },
        {
          fullName: "Dr. Ananya Sharma",
          email: "ananya.sharma@platform.edu",
          specialization: "System Design & Distributed Systems",
          experience: 10,
        },
        { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
      ),
      TeacherModel.findOneAndUpdate(
        { email: "rohit.mehta@platform.edu" },
        {
          fullName: "Rohit Mehta",
          email: "rohit.mehta@platform.edu",
          specialization: "Node.js & MongoDB Architecture",
          experience: 7,
        },
        { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
      ),
    ]);

    const user = await UserModel.findOneAndUpdate(
      { email: "arun.kumar@example.com" },
      {
        fullName: "Arun Kumar",
        email: "arun.kumar@example.com",
        phone: "+919876543210",
      },
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
    );

    const baseDate = new Date();
    const year = baseDate.getUTCFullYear();
    const month = baseDate.getUTCMonth();
    const day = baseDate.getUTCDate() + 1;

    const existingCount = await SessionModel.countDocuments();
    if (existingCount === 0 && teachers[0] && teachers[1] && user) {
      await SessionModel.insertMany([
        {
          teacherId: teachers[0]._id,
          userId: null,
          startTime: new Date(Date.UTC(year, month, day, 9, 0, 0)),
          endTime: new Date(Date.UTC(year, month, day, 10, 0, 0)),
          status: SessionStatus.AVAILABLE,
          completedAt: null,
        },
        {
          teacherId: teachers[1]._id,
          userId: null,
          startTime: new Date(Date.UTC(year, month, day, 11, 0, 0)),
          endTime: new Date(Date.UTC(year, month, day, 12, 0, 0)),
          status: SessionStatus.AVAILABLE,
          completedAt: null,
        },
        {
          teacherId: teachers[0]._id,
          userId: user._id,
          startTime: new Date(Date.UTC(year, month, day, 14, 0, 0)),
          endTime: new Date(Date.UTC(year, month, day, 15, 0, 0)),
          status: SessionStatus.BOOKED,
          completedAt: null,
        },
      ]);
    }

    logger.info(
      {
        teachers: teachers.map((t) => ({ id: t?._id, name: t?.fullName })),
        user: { id: user?._id, email: user?.email },
      },
      "Seed completed successfully",
    );
  } catch (error: unknown) {
    logger.error({ error }, "Seed failed");
    process.exitCode = 1;
  } finally {
    await disconnectDB();
  }
}

void seed();
