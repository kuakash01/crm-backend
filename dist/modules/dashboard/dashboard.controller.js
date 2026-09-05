"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDashboard = void 0;
// import { permissions } from "../../middleware/auth.middleware";
const dashboard_service_1 = require("./dashboard.service");
const getDashboard = async (req, res, next) => {
    try {
        const data = await (0, dashboard_service_1.getDashboardStats)(req.user.organization_id, req.user.id, req.user.permissions.includes("leads:view_unassigned") ?? false);
        res.status(200).json({
            success: true,
            data,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getDashboard = getDashboard;
