import type { Types } from "mongoose";
import UserModel, {
  type IUser,
  type UserDocument,
} from "../models/user.model.js";

export interface CreateUserPayload {
  fullName: string;
  email: string;
  phone: string;
}

export default class UserRepository {
  async create(payload: CreateUserPayload): Promise<UserDocument> {
    return await UserModel.create(payload);
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return await UserModel.findOne({ email: email.toLowerCase().trim() });
  }

  async findById(id: string | Types.ObjectId): Promise<UserDocument | null> {
    return await UserModel.findById(id);
  }

  async findAll(): Promise<IUser[]> {
    return await UserModel.find().sort({ createdAt: -1 }).lean();
  }
}
