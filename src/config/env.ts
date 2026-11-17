import { z } from "zod";
import dotenv from "dotenv";
import logger from "./logger.js";
import defaultConstant from "../constant/app.constant.js";

dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(defaultConstant.PORT),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default(defaultConstant.NODE_ENV),
  MONGO_URL: z.string().min(1).default(defaultConstant.MONGO_URL),
  CORS_ORIGIN: z.string().default(defaultConstant.CORS_ORIGIN),
  RATE_LIMIT_WINDOW_MS: z.coerce
    .number()
    .int()
    .positive()
    .default(defaultConstant.RATE_LIMIT_WINDOW_MS),
  RATE_LIMIT_MAX: z.coerce
    .number()
    .int()
    .positive()
    .default(defaultConstant.RATE_LIMIT_MAX),
});

export type EnvConfig = z.infer<typeof envSchema>;

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const missingKeys = parsed.error.issues
    .map((issue) => issue.path.join("."))
    .join(", ");
  logger.error(
    `Environment validation failed. Missing or invalid variables: ${missingKeys}`,
  );
  process.exit(1);
}

const env: EnvConfig = parsed.data;

export default env;
