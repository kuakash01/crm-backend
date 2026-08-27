import { pool } from "../../config/db";
import {
  NotificationType,
  NotificationAction,
} from "./notification.types";

import { getIO } from "../../config/socket";

interface CreateNotificationParams {
  organizationId: number;
  userIds: number[];
  type: NotificationType;
  action: NotificationAction;
  title: string;
  message: string;
  entityType?: string | null;
  entityId?: number | null;
}

export const createNotifications = async ({
  organizationId,
  userIds,
  type,
  action,
  title,
  message,
  entityType = null,
  entityId = null,
}: CreateNotificationParams) => {
  if (!userIds.length) {
    return [];
  }

  const result = await pool.query(
    `
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
    `,
    [
      organizationId,
      userIds,
      type,
      action,
      title,
      message,
      entityType,
      entityId,
    ]
  );

  const notifications = result.rows;

  const io = getIO();

  for (const notification of notifications) {
    io.to(`user:${notification.user_id}`).emit(
      "notification:new",
      notification
    );
  }

  return notifications;
};