import express, { type Application, type Request, type Response } from "express";
import { StatusCodes } from "http-status-codes";
import securityMiddleware from "./middlewares/security.middleware.js";
import userRoutes from "./modules/user/user.route.js";
import teacherRoutes from "./modules/teacher/teacher.route.js";
import sessionRoutes from "./modules/session/session.route.js";
import notFoundMiddleware from "./middlewares/notFound.middleware.js";
import errorHandler from "./middlewares/errorHandler.middleware.js";

export default function createApp(): Application {
  const app: Application = express();

  securityMiddleware(app);

  app.get("/health", (_req: Request, res: Response) => {
    res.status(StatusCodes.OK).json({
      success: true,
      message: "Server is healthy",
      timestamp: new Date().toISOString(),
    });
  });

  app.use("/users", userRoutes);
  app.use("/teachers", teacherRoutes);
  app.use("/sessions", sessionRoutes);

  app.use(notFoundMiddleware);
  app.use(errorHandler);

  return app;
}
