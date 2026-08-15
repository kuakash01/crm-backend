import { pool } from "../../config/db";
import { NotificationType, NotificationAction } from "./notification.types";

interface CreateNotificationParams {
  organizationId: number;
  userId: number;

  type: NotificationType;

  action: NotificationAction;

  title: string;
  message: string;

  entityType?: string | null;
  entityId?: number | null;
}

export const createNotification = async ({
  organizationId,
  userId,
  type,
  action,
  title,
  message,
  entityType = null,
  entityId = null,
}: CreateNotificationParams) => {
  await pool.query(
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
    VALUES (
      $1,$2,$3,$4,$5,$6,$7,$8
    )
    `,
    [
      organizationId,
      userId,
      type,
      action,
      title,
      message,
      entityType,
      entityId,
    ]
  );
};

export const createNotifications = async ({
  organizationId,
  userIds,
  type,
  action,
  title,
  message,
  entityType = null,
  entityId = null,
}: {
  organizationId: number;
  userIds: number[];

  type: NotificationType;

  action: NotificationAction;

  title: string;
  message: string;

  entityType?: string | null;
  entityId?: number | null;
}) => {
  if (!userIds.length) {
    return;
  }

  await pool.query(
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
};