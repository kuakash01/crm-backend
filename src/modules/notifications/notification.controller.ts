import { Request, Response } from "express";

import {
  getNotifications,
  getUnreadCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "./notification.service";

export const getAllNotifications = async (
  req: Request,
  res: Response
) => {
  try {
    const { organization_id, id } = req.user!;

    const notifications = await getNotifications(
      organization_id,
      id,
      {
        page: req.query.page
          ? Number(req.query.page)
          : 1,

        limit: req.query.limit
          ? Number(req.query.limit)
          : 10,
      }
    );

    res.status(200).json({
      success: true,
      data: notifications,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch notifications.",
    });
  }
};

export const unreadNotificationCount = async (
  req: Request,
  res: Response
) => {
  try {
    const { organization_id, id } = req.user!;

    const count = await getUnreadCount(
      organization_id,
      id
    );

    res.status(200).json({
      success: true,
      data: count,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch unread notification count.",
    });
  }
};

export const readNotification = async (
  req: Request,
  res: Response
) => {
  try {
    const { organization_id, id } = req.user!;

    await markNotificationAsRead(
      organization_id,
      id,
      Number(req.params.id)
    );

    res.status(200).json({
      success: true,
      message: "Notification marked as read.",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to mark notification as read.",
    });
  }
};

export const readAllNotifications = async (
  req: Request,
  res: Response
) => {
  try {
    const { organization_id, id } = req.user!;

    await markAllNotificationsAsRead(
      organization_id,
      id
    );

    res.status(200).json({
      success: true,
      message: "All notifications marked as read.",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to mark all notifications as read.",
    });
  }
};