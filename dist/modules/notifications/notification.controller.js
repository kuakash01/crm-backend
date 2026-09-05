"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.readAllNotifications = exports.readNotification = exports.unreadNotificationCount = exports.getAllNotifications = void 0;
const notification_service_1 = require("./notification.service");
const getAllNotifications = async (req, res) => {
    try {
        const { organization_id, id } = req.user;
        const notifications = await (0, notification_service_1.getNotifications)(organization_id, id, {
            page: req.query.page
                ? Number(req.query.page)
                : 1,
            limit: req.query.limit
                ? Number(req.query.limit)
                : 10,
        });
        res.status(200).json({
            success: true,
            data: notifications,
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch notifications.",
        });
    }
};
exports.getAllNotifications = getAllNotifications;
const unreadNotificationCount = async (req, res) => {
    try {
        const { organization_id, id } = req.user;
        const count = await (0, notification_service_1.getUnreadCount)(organization_id, id);
        res.status(200).json({
            success: true,
            data: count,
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch unread notification count.",
        });
    }
};
exports.unreadNotificationCount = unreadNotificationCount;
const readNotification = async (req, res) => {
    try {
        const { organization_id, id } = req.user;
        await (0, notification_service_1.markNotificationAsRead)(organization_id, id, Number(req.params.id));
        res.status(200).json({
            success: true,
            message: "Notification marked as read.",
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Failed to mark notification as read.",
        });
    }
};
exports.readNotification = readNotification;
const readAllNotifications = async (req, res) => {
    try {
        const { organization_id, id } = req.user;
        await (0, notification_service_1.markAllNotificationsAsRead)(organization_id, id);
        res.status(200).json({
            success: true,
            message: "All notifications marked as read.",
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Failed to mark all notifications as read.",
        });
    }
};
exports.readAllNotifications = readAllNotifications;
