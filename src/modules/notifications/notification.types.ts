export type NotificationType =
  | "LEAD"
  | "CUSTOMER"
  | "DEAL"
  | "TASK"
  | "USER"
  | "SERVICE"
  | "SYSTEM";

export type NotificationAction =
  | "CREATED"
  | "UPDATED"
  | "ASSIGNED"
  | "COMPLETED"
  | "CONVERTED"
  | "STAGE_CHANGED"
  | "WON"
  | "LOST"
  | "DUE"
  | "OVERDUE"
  | "STATUS_CHANGED";