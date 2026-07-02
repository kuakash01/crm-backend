import {
  Request,
  Response,
  NextFunction,
} from "express";

import * as userService from "./users.service";


export const getUsers = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {

    const users =
      await userService.getUsers(
        req.user.organization_id
      );

    res.status(200).json({
      status: "success",
      data: users,
    });

  } catch (error) {
    next(error);
  }
};

export const getUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {

    const user =
      await userService.getUser(
        Number(req.params.id),
        req.user.organization_id
      );

    res.status(200).json({
      status: "success",
      data: user,
    });

  } catch (error) {
    next(error);
  }
};

export const createUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {

    const user =
      await userService.createUser(
        req.body,
        req.user.organization_id
      );

    res.status(201).json({
      status: "success",
      message:
        "User created successfully",
      data: user,
    });

  } catch (error) {
    next(error);
  }
};

export const updateUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {

    await userService.updateUser(
      Number(req.params.id),
      req.user.organization_id,
      req.body
    );

    res.status(200).json({
      status: "success",
      message:
        "User updated successfully",
    });

  } catch (error) {
    next(error);
  }
};

export const changeRole = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {

    await userService.changeRole(
      Number(req.params.id),
      req.body.roleId,
      req.user.organization_id
    );

    res.status(200).json({
      status: "success",
      message:
        "Role updated successfully",
    });

  } catch (error) {
    next(error);
  }
};


export const changeStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {

    await userService.changeStatus(
      Number(req.params.id),
      req.body.isActive,
      req.user.organization_id
    );

    res.status(200).json({
      status: "success",
      message:
        "Status updated successfully",
    });

  } catch (error) {
    next(error);
  }
};


export const deleteUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    
    await userService.deleteUser(
      Number(req.params.id),
      req.user.organization_id
    );

    res.status(200).json({
      status: "success",
      message:
        "User deleted successfully",
    });

  } catch (error) {
    next(error);
  }
};

export const getAssignableUsers = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const users =
      await userService.getAssignableUsers(
        req.user.id
      );

    res.status(200).json({
      status: "success",
      data: users,
    });
  } catch (error) {
    next(error);
  }
};