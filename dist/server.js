"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const env_1 = require("./config/env");
const http_1 = require("http");
const socket_1 = require("./config/socket");
const notificationCleanup_job_1 = require("./jobs/notificationCleanup.job");
const app_1 = __importDefault(require("./app"));
const PORT_NO = Number(env_1.PORT) || 8000;
const httpServer = (0, http_1.createServer)(app_1.default);
// console.log("db name", DB_NAME);
// websocket setup
(0, socket_1.initializeSocket)(httpServer);
// cron job
(0, notificationCleanup_job_1.startNotificationCleanupJob)();
httpServer.listen(PORT_NO, () => {
    console.log(`Server is running on port ${PORT_NO}`);
});
