import type { Server } from "node:http";
import createApp from "./src/app.js";
import { connectDB, disconnectDB } from "./src/database/db.js";
import logger from "./src/config/logger.js";
import env from "./src/config/env.js";

async function startServer(): Promise<void> {
  try {
    await connectDB();

    const app = createApp();
    const server: Server = app.listen(env.PORT, () => {
      logger.info({ port: env.PORT, env: env.NODE_ENV }, "Server is running");
    });

    const shutdown = async (signal: string): Promise<void> => {
      logger.info({ signal }, "Shutting down server gracefully");
      await new Promise<void>((resolve, reject) => {
        server.close((err?: Error) => {
          if (err) {
            reject(err);
            return;
          }
          resolve();
        });
      });
      await disconnectDB();
      process.exit(0);
    };

    process.on("SIGINT", () => {
      void shutdown("SIGINT");
    });

    process.on("SIGTERM", () => {
      void shutdown("SIGTERM");
    });
  } catch (error: unknown) {
    logger.error({ error }, "Failed to start server");
    process.exit(1);
  }
}

void startServer();
