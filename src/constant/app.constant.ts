export const SessionStatus = {
  AVAILABLE: "AVAILABLE",
  BOOKED: "BOOKED",
  COMPLETED: "COMPLETED",
} as const;

export type SessionStatusType =
  (typeof SessionStatus)[keyof typeof SessionStatus];

export interface AppConfigConstant {
  PORT: number;
  NODE_ENV: "development" | "production" | "test";
  MONGO_URL: string;
  CORS_ORIGIN: string;
  RATE_LIMIT_WINDOW_MS: number;
  RATE_LIMIT_MAX: number;
}

const defaultConstant: AppConfigConstant = {
  PORT: 3000,
  NODE_ENV: "development",
  MONGO_URL: "mongodb://127.0.0.1:27017/session_booking",
  CORS_ORIGIN: "*",
  RATE_LIMIT_WINDOW_MS: 15 * 60 * 1000,
  RATE_LIMIT_MAX: 100,
};

export default defaultConstant;
