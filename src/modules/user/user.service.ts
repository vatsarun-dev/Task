import UserRepository, {
  type CreateUserPayload,
} from "../../repository/user.repo.js";
import SessionRepository, {
  type UserSessionsAggregateResult,
} from "../../repository/session.repo.js";
import type { IUser, UserDocument } from "../../models/user.model.js";
import { ConflictError, NotFoundError } from "../../shared/error/globalError.js";

export type CreateUserDTO = CreateUserPayload;

export default class UserService {
  private readonly userRepo: UserRepository;
  private readonly sessionRepo: SessionRepository;

  constructor() {
    this.userRepo = new UserRepository();
    this.sessionRepo = new SessionRepository();
  }

  async createUser(payload: CreateUserDTO): Promise<UserDocument> {
    const normalizedEmail = payload.email.toLowerCase().trim();
    const existingUser = await this.userRepo.findByEmail(normalizedEmail);
    if (existingUser) {
      throw new ConflictError("A user with this email already exists");
    }

    return await this.userRepo.create({
      fullName: payload.fullName.trim(),
      email: normalizedEmail,
      phone: payload.phone.trim(),
    });
  }

  async listUsers(): Promise<IUser[]> {
    return await this.userRepo.findAll();
  }

  async getUserSessions(userId: string): Promise<UserSessionsAggregateResult> {
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new NotFoundError("User not found");
    }

    return await this.sessionRepo.findUserSessionsGrouped(userId);
  }
}
