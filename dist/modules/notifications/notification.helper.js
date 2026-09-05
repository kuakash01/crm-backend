"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createNotifications = void 0;
const db_1 = require("../../config/db");
const socket_1 = require("../../config/socket");
const createNotifications = async ({ organizationId, userIds, type, action, title, message, entityType = null, entityId = null, }) => {
    if (!userIds.length) {
        return [];
    }
    const result = await db_1.pool.query(`
    INSERT INTO notifications (
      organization_id,
      user_id,
      type,
      action,
      title,
      message,
      entity_type,
      entity_id
    )
    SELECT
      $1,
      UNNEST($2::int[]),
      $3,
      $4,
      $5,
      $6,
      $7,
      $8
    RETURNING
      id,
      organization_id,
      user_id,
      type,
      action,
      title,
      message,
      entity_type,
      entity_id,
      is_read,
      created_at
    `, [
        organizationId,
        userIds,
        type,
        action,
        title,
        message,
        entityType,
        entityId,
    ]);
    const notifications = result.rows;
    const io = (0, socket_1.getIO)();
    for (const notification of notifications) {
        io.to(`user:${notification.user_id}`).emit("notification:new", notification);
    }
    return notifications;
};
exports.createNotifications = createNotifications;
