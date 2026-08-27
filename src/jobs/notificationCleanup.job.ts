import cron from "node-cron";
import { pool } from "../config/db";

export const startNotificationCleanupJob = () => {
  cron.schedule("0 2 * * *", async () => {
    try {
      const result = await pool.query(`
        DELETE FROM notifications
        WHERE created_at < NOW() - INTERVAL '90 days'
      `);

      console.log(
        `Notification cleanup: deleted ${result.rowCount ?? 0} notifications`,
      );
    } catch (error) {
      console.error(
        "Notification cleanup failed:",
        error,
      );
    }
  });

  console.log(
    "Notification cleanup job scheduled",
  );
};