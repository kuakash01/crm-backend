"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.markAllNotificationsAsRead = exports.markNotificationAsRead = exports.getUnreadCount = exports.getNotifications = void 0;
const db_1 = require("../../config/db");
const pagination_helper_1 = require("../../shared/helpers/pagination.helper");
const getNotifications = async (organizationId, userId, options) => {
    const { page, limit, offset, } = (0, pagination_helper_1.buildPagination)(options);
    const [notificationsResult, countResult] = await Promise.all([
        db_1.pool.query(`
        SELECT
          id,
          type,
          action,
          title,
          message,
          entity_type,
          entity_id,
          is_read,
          created_at
        FROM notifications
        WHERE
          organization_id = $1
          AND user_id = $2
        ORDER BY
          created_at DESC
        LIMIT $3
        OFFSET $4
        `, [
            organizationId,
            userId,
            limit,
            offset,
        ]),
        db_1.pool.query(`
        SELECT
          COUNT(*)::int AS total
        FROM notifications
        WHERE
          organization_id = $1
          AND user_id = $2
        `, [
            organizationId,
            userId,
        ]),
    ]);
    return (0, pagination_helper_1.buildPaginationResponse)(notificationsResult.rows, page, limit, countResult.rows[0].total);
};
exports.getNotifications = getNotifications;
const getUnreadCount = async (organizationId, userId) => {
    const result = await db_1.pool.query(`
    SELECT COUNT(*)::int AS count
    FROM notifications
    WHERE organization_id = $1
      AND user_id = $2
      AND is_read = FALSE
    `, [organizationId, userId]);
    return result.rows[0];
};
exports.getUnreadCount = getUnreadCount;
const markNotificationAsRead = async (organizationId, userId, notificationId) => {
    await db_1.pool.query(`
    UPDATE notifications
    SET is_read = TRUE
    WHERE id = $1
      AND organization_id = $2
      AND user_id = $3
    `, [notificationId, organizationId, userId]);
};
exports.markNotificationAsRead = markNotificationAsRead;
const markAllNotificationsAsRead = async (organizationId, userId) => {
    await db_1.pool.query(`
      UPDATE notifications
      SET is_read = TRUE
      WHERE organization_id = $1
        AND user_id = $2
        AND is_read = FALSE
      `, [organizationId, userId]);
};
exports.markAllNotificationsAsRead = markAllNotificationsAsRead;
