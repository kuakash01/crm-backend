import { pool } from "../../config/db";
import { buildPagination, PaginationOptions, buildPaginationResponse } from "../../shared/helpers/pagination.helper";

export const getNotifications = async (
  organizationId: number,
  userId: number,
  options?: PaginationOptions
) => {
  const {
    page,
    limit,
    offset,
  } = buildPagination(options);

  const [notificationsResult, countResult] =
    await Promise.all([
      pool.query(
        `
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
        `,
        [
          organizationId,
          userId,
          limit,
          offset,
        ]
      ),

      pool.query(
        `
        SELECT
          COUNT(*)::int AS total
        FROM notifications
        WHERE
          organization_id = $1
          AND user_id = $2
        `,
        [
          organizationId,
          userId,
        ]
      ),
    ]);

  return buildPaginationResponse(
    notificationsResult.rows,
    page,
    limit,
    countResult.rows[0].total
  );
};

export const getUnreadCount = async (
  organizationId: number,
  userId: number
) => {
  const result = await pool.query(
    `
    SELECT COUNT(*)::int AS count
    FROM notifications
    WHERE organization_id = $1
      AND user_id = $2
      AND is_read = FALSE
    `,
    [organizationId, userId]
  );

  return result.rows[0];
};

export const markNotificationAsRead = async (
  organizationId: number,
  userId: number,
  notificationId: number
) => {
  await pool.query(
    `
    UPDATE notifications
    SET is_read = TRUE
    WHERE id = $1
      AND organization_id = $2
      AND user_id = $3
    `,
    [notificationId, organizationId, userId]
  );
};

export const markAllNotificationsAsRead =
  async (
    organizationId: number,
    userId: number
  ) => {
    await pool.query(
      `
      UPDATE notifications
      SET is_read = TRUE
      WHERE organization_id = $1
        AND user_id = $2
        AND is_read = FALSE
      `,
      [organizationId, userId]
    );
  };