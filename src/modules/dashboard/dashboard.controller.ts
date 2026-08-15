import { Request, Response, NextFunction } from "express";
// import { permissions } from "../../middleware/auth.middleware";
import { getDashboardStats } from "./dashboard.service";

export const getDashboard = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = await getDashboardStats(
      req.user.organization_id,
      req.user.id,
      req.user.permissions.includes(
        "leads:view_unassigned"
      ) ?? false
    );

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};