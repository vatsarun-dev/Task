import {
  Schema,
  model,
  type HydratedDocument,
  type Model,
} from "mongoose";

export interface IUser {
  fullName: string;
  email: string;
  phone: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export type UserDocument = HydratedDocument<IUser>;
export type UserModelType = Model<IUser>;

const userSchema = new Schema<IUser, UserModelType>(
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
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

const UserModel = model<IUser, UserModelType>("User", userSchema);

export default UserModel;
