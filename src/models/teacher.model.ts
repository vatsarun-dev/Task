import {
  Schema,
  model,
  type HydratedDocument,
  type Model,
} from "mongoose";

export interface ITeacher {
  fullName: string;
  email: string;
  specialization: string;
  experience: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export type TeacherDocument = HydratedDocument<ITeacher>;
export type TeacherModelType = Model<ITeacher>;

const teacherSchema = new Schema<ITeacher, TeacherModelType>(
  {
    fullName: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
      minlength: [2, "Full name must be at least 2 characters"],
      maxlength: [100, "Full name must be at most 100 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    specialization: {
      type: String,
      required: [true, "Specialization is required"],
      trim: true,
    },
    experience: {
      type: Number,
      required: [true, "Experience is required"],
      min: [0, "Experience cannot be negative"],
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

const TeacherModel = model<ITeacher, TeacherModelType>("Teacher", teacherSchema);

export default TeacherModel;
