import {
  Schema,
  model,
  type HydratedDocument,
  type Model,
  type Types,
} from "mongoose";
import {
  SessionStatus,
  type SessionStatusType,
} from "../constant/app.constant.js";

export interface ISession {
  teacherId: Types.ObjectId;
  userId: Types.ObjectId | null;
  startTime: Date;
  endTime: Date;
  status: SessionStatusType;
  completedAt: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export type SessionDocument = HydratedDocument<ISession>;
export type SessionModelType = Model<ISession>;

const sessionSchema = new Schema<ISession, SessionModelType>(
  {
    teacherId: {
      type: Schema.Types.ObjectId,
      ref: "Teacher",
      required: [true, "Teacher ID is required"],
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    startTime: {
      type: Date,
      required: [true, "Start time is required"],
      index: true,
    },
    endTime: {
      type: Date,
      required: [true, "End time is required"],
      validate: {
        validator: function (value: Date): boolean {
          if (
            this &&
            "startTime" in this &&
            this.startTime instanceof Date
          ) {
            return value.getTime() > this.startTime.getTime();
          }
          return true;
        },
        message: "endTime must be greater than startTime",
      },
    },
    status: {
      type: String,
      enum: Object.values(SessionStatus),
      default: SessionStatus.AVAILABLE,
      required: true,
      index: true,
    },
    completedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

// Compound indexes for aggregation pipeline queries
sessionSchema.index({ status: 1, startTime: 1 });
sessionSchema.index({ userId: 1, status: 1, startTime: 1 });
sessionSchema.index({ teacherId: 1, startTime: 1 });

const SessionModel = model<ISession, SessionModelType>("Session", sessionSchema);

export default SessionModel;
