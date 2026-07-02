import { Request, Response, NextFunction } from "express";
import * as activitiesService from "./activites.service";

export const getActivities = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {

  try {

    const entityType = (req.params.entityType).toString().toUpperCase();
    const entityId = Number(req.params.entityId);

    const activities =
      await activitiesService.getActivities(
        Number(req.user.organization_id),
        entityType,
        entityId
      );

    res.status(200).json({
      status: "success",
      data: activities
    });

  } catch (error) {

    next(error);

  }
};