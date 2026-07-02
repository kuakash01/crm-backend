import {
  Request,
  Response,
  NextFunction,
} from "express";

import * as roleService from "./roles.service";

export const getRoles = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const roles =
      await roleService.getRoles(
        req.user.organization_id
      );

    res.status(200).json({
      data: roles,
    });
  } catch (error) {
    next(error);
  }
};

export const createRole = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
 
    const role =
      await roleService.createRole(
        req.user.organization_id,
        req.body
      );

    res.status(201).json({
      message:
        "Role created successfully",
      data: role,
    });
  } catch (error) {
    next(error);
  }
};

export const updateRole = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const role =
      await roleService.updateRole(
        Number(req.params.id),
        req.user.organization_id,
        req.body
      );

    res.status(200).json({
      message:
        "Role updated successfully",
      data: role,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteRole = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    await roleService.deleteRole(
      Number(req.params.id),
      req.user.organization_id
    );

    res.status(200).json({
      message:
        "Role deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const getRolePermissions = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const data =
      await roleService.getRolePermissions(
        Number(req.params.id),
        req.user.organization_id
      );

    res.status(200).json({
      message:
        "Permissions fetched successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const updateRolePermissions =
  async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { permissionIds } =
        req.body;

      await roleService.updateRolePermissions(
        Number(req.params.id),
        req.user.organization_id,
        permissionIds
      );

      res.status(200).json({
        message:
          "Permissions updated successfully",
      });
    } catch (error) {
      next(error);
    }
  };