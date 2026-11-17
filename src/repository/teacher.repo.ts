import type { Types } from "mongoose";
import TeacherModel, {
  type ITeacher,
  type TeacherDocument,
} from "../models/teacher.model.js";

export interface CreateTeacherPayload {
  fullName: string;
  email: string;
  specialization: string;
  experience: number;
}

export default class TeacherRepository {
  async create(payload: CreateTeacherPayload): Promise<TeacherDocument> {
    return await TeacherModel.create(payload);
  }

  async findByEmail(email: string): Promise<TeacherDocument | null> {
    return await TeacherModel.findOne({ email: email.toLowerCase().trim() });
  }

  async findById(id: string | Types.ObjectId): Promise<TeacherDocument | null> {
    return await TeacherModel.findById(id);
  }

  async findAll(): Promise<ITeacher[]> {
    return await TeacherModel.find().sort({ createdAt: -1 }).lean();
  }
}
