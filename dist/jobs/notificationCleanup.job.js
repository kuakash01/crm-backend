"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startNotificationCleanupJob = void 0;
const node_cron_1 = __importDefault(require("node-cron"));
const db_1 = require("../config/db");
const startNotificationCleanupJob = () => {
    node_cron_1.default.schedule("0 2 * * *", async () => {
        try {
            const result = await db_1.pool.query(`
        DELETE FROM notifications
        WHERE created_at < NOW() - INTERVAL '90 days'
      `);
            console.log(`Notification cleanup: deleted ${result.rowCount ?? 0} notifications`);
        }
        catch (error) {
            console.error("Notification cleanup failed:", error);
        }
    });
    console.log("Notification cleanup job scheduled");
};
exports.startNotificationCleanupJob = startNotificationCleanupJob;
