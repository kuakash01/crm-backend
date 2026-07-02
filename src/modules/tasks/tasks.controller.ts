import { Request, Response, NextFunction } from "express";
import * as taskService from "./tasks.service";

// task controller starts
export const createTask = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {

  try {
  
    const task =
      await taskService.createTask(
        req.user.organization_id,
        (req.params.entityType).toString().toUpperCase(),
        Number(req.params.entityId),
        req.user.id,
        req.body
      );

    res.status(201).json({
      status: "success",
      data: task
    });

  } catch (error) {

    next(error);

  }

};

export const getTasks = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {

  try {

    const tasks =
      await taskService.getTasks(
        Number(req.user.organization_id),
        (req.params.entityType).toString().toUpperCase(),
        Number(req.params.entityId)
      );

    res.status(200).json({
      status: "success",
      data: tasks
    });

  } catch (error) {

    next(error);

  }

};

export const updateTask = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {

  try {

    const task =
      await taskService.updateTask(
        Number(req.user.organization_id),
        (req.params.entityType).toString().toUpperCase(),
        Number(req.params.entityId),
        Number(req.params.taskId),
        req.body
      );

    res.status(200).json({
      status: "success",
      data: task
    });

  } catch (error) {

    next(error);

  }

};

export const updateTaskStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {

  try {

    const task =
      await taskService.updateTaskStatus(
        Number(req.user.organization_id),
        (req.params.entityType).toString().toUpperCase(),
        Number(req.params.entityId),
        Number(req.params.taskId),
        req.body.status,
        req.user.id
      );

    res.status(200).json({
      status: "success",
      data: task
    });

  } catch (error) {

    next(error);

  }

};

export const deleteTask = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {

  try {

    await taskService.deleteTask(
      Number(req.user.organization_id),
      (req.params.entityType).toString().toUpperCase(),
      Number(req.params.entityId),
      Number(req.params.taskId),
    );

    res.status(200).json({
      status: "success"
    });

  } catch (error) {

    next(error);

  }

};
