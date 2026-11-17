import type { Application } from "express";
import express from "express";
import hpp from "hpp";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import compression from "compression";
import cors from "cors";
import morgan from "morgan";
import env from "../config/env.js";

export default function securityMiddleware(app: Application): void {
  if (env.NODE_ENV !== "test") {
    app.use(morgan("dev"));
  }

  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true, limit: "1mb" }));

  app.use(
    cors({
      origin: env.CORS_ORIGIN === "*" ? true : env.CORS_ORIGIN,
      credentials: true,
    }),
  );

  app.use(hpp());
  app.use(helmet());
  app.use(compression());

  if (env.NODE_ENV !== "test") {
    app.use(
      rateLimit({
        windowMs: env.RATE_LIMIT_WINDOW_MS,
        limit: env.RATE_LIMIT_MAX,
        standardHeaders: true,
        legacyHeaders: false,
        message: {
          success: false,
          message: "Too many requests, please try again later.",
        },
      }),
    );
  }
}
