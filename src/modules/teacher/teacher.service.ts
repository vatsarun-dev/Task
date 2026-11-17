import TeacherRepository, {
  type CreateTeacherPayload,
} from "../../repository/teacher.repo.js";
import type { ITeacher, TeacherDocument } from "../../models/teacher.model.js";
import { ConflictError } from "../../shared/error/globalError.js";

export type CreateTeacherDTO = CreateTeacherPayload;

export default class TeacherService {
  private readonly teacherRepo: TeacherRepository;

  constructor() {
    this.teacherRepo = new TeacherRepository();
  }

  async createTeacher(payload: CreateTeacherDTO): Promise<TeacherDocument> {
    const normalizedEmail = payload.email.toLowerCase().trim();
    const existingTeacher = await this.teacherRepo.findByEmail(normalizedEmail);
    if (existingTeacher) {
      throw new ConflictError("A teacher with this email already exists");
    }

    return await this.teacherRepo.create({
      fullName: payload.fullName.trim(),
      email: normalizedEmail,
      specialization: payload.specialization.trim(),
      experience: Number(payload.experience),
    });
  }

  async listTeachers(): Promise<ITeacher[]> {
    return await this.teacherRepo.findAll();
  }
}
