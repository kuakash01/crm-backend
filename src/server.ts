import dotenv from "dotenv";
dotenv.config();

import { PORT } from "./config/env";
import { createServer } from "http";
import { initializeSocket } from "./config/socket";
import { startNotificationCleanupJob } from "./jobs/notificationCleanup.job";


import app from "./app";

const PORT_NO: number = Number(PORT) || 8000;

const httpServer = createServer(app);

// console.log("db name", DB_NAME);

// websocket setup
initializeSocket(httpServer);

// cron job
startNotificationCleanupJob();

httpServer.listen(PORT_NO, () => {
  console.log(`Server is running on port ${PORT_NO}`);
});