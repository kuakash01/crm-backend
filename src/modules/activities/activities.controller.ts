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

export const createActivity = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const entityType = req.params.entityType.toString().toUpperCase();
    const entityId = Number(req.params.entityId);
    const { activityType, description } = req.body;

    if (!activityType || !description) {
      return res.status(400).json({
        status: "error",
        message: "activityType and description are required",
      });
    }

    const created = await activitiesService.createActivities([
      {
        organizationId: Number(req.user.organization_id),
        entityType,
        entityId,
        activityType,
        description,
        createdBy: Number(req.user.id),
      },
    ]);

    res.status(201).json({
      status: "success",
      message: "Activity logged successfully",
      data: created[0],
    });
  } catch (error) {
    next(error);
  }
};