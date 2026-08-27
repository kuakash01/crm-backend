import { Request, Response, NextFunction } from "express";
import * as taskService from "./tasks.service";
import { AppError } from "../../shared/errors/AppError";

// task controller starts

export const createTask = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const task = await taskService.createTask(
      req.user.organization_id,
      req.user.id,
      {
        ...req.body,

        entity_type:
          req.body.entity_type
            ?.toString()
            .toUpperCase() ?? null,

        entity_id:
          req.body.entity_id
            ? Number(req.body.entity_id)
            : null,
      }
    );

    res.status(201).json({
      status: "success",
      data: task,
    });
  } catch (error) {
    next(error);
  }
};

export const getAllTasks = async (
  req: Request,
  res: Response
) => {
  try {
    const { organization_id, id } = req.user!;

    const page =
      Number(req.query.page) || 1;

    const limit =
      Number(req.query.limit) || 10;

    const search =
      String(req.query.search || "");

    const status =
      req.query.status
        ?.toString()
        .toUpperCase() as
      | "PENDING"
      | "COMPLETED"
      | undefined;

    const entityType =
      req.query.entityType
        ?.toString()
        .toUpperCase() as
      | "LEAD"
      | "CUSTOMER"
      | "DEAL"
      | "GENERAL"
      | undefined;

    const priority =
      req.query.priority
        ?.toString()
        .toUpperCase() as
      | "LOW"
      | "NORMAL"
      | "HIGH"
      | "URGENT"
      | undefined;

    const data =
      await taskService.getAllTasksService({
        organizationId: organization_id,
        currentUserId: id,
        page,
        limit,
        search,
        status,
        entityType,
        priority,
      });

    res.status(200).json({
      success: true,
      message: "Tasks fetched successfully.",
      data,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch tasks.",
    });
  }
};


export const getTaskById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const organizationId = req.user.organization_id;
    const taskId = Number(req.params.taskId);

    if (Number.isNaN(taskId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid task ID",
      });
    }

    const task = await taskService.getTaskById(
      organizationId,
      taskId
    );

    return res.status(200).json({
      success: true,
      data: task,
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
    const organizationId = req.user.organization_id;
    const taskId = Number(req.params.taskId);

    if (Number.isNaN(taskId)) {
      throw new AppError("Invalid task ID", 400);
    }

    const task = await taskService.updateTask(
      organizationId,
      req.user.id,
      taskId,
      req.body
    );

    return res.status(200).json({
      success: true,
      message: "Task updated successfully",
      data: task,
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
    const organizationId = req.user.organization_id;
    const currentUserId = req.user.id;
    const taskId = Number(req.params.taskId);

    if (Number.isNaN(taskId)) {
      throw new AppError("Invalid task ID", 400);
    }

    const { status } = req.body;

    if (
      status !== "PENDING" &&
      status !== "COMPLETED"
    ) {
      throw new AppError("Invalid task status", 400);
    }

    const task = await taskService.updateTaskStatus(
      organizationId,
      taskId,
      status,
      currentUserId
    );

    return res.status(200).json({
      success: true,
      message: "Task status updated successfully",
      data: task,
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
    const organizationId = req.user.organization_id;
    const taskId = Number(req.params.taskId);

    if (Number.isNaN(taskId)) {
      throw new AppError("Invalid task ID", 400);
    }

    await taskService.deleteTask(
      organizationId,
      taskId
    );

    return res.status(200).json({
      success: true,
      message: "Task deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};