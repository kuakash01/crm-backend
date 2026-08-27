import {
  Request,
  Response,
  NextFunction,
} from "express";

import * as userService from "./users.service";
import { AppError } from "../../shared/errors/AppError";



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
      {
        fullName: req.body.fullName,
        phone: req.body.phone,
        reportsTo: req.body.reportsTo,
        roleId: req.body.roleId
      }
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
      req.user.organization_id,
      Number(req.user.id)
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
      req.user.organization_id,
      Number(req.user.id)
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



export const getPendingInvitations = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const organizationId =
      req.user.organization_id;

    const invitations =
      await userService.getPendingInvitations(
        organizationId,
      );

    return res.status(200).json({
      status: "success",
      data: invitations,
    });
  } catch (error) {
    next(error);
  }
};

export const resendInvitation = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const invitationId = Number(
      req.params.id,
    );

    if (Number.isNaN(invitationId)) {
      throw new AppError(
        "Invalid invitation ID",
        400,
      );
    }

    const organizationId =
      req.user.organization_id;

    const invitation =
      await userService.resendInvitation(
        invitationId,
        organizationId,
      );

    return res.status(200).json({
      status: "success",
      message: "Invitation resent successfully",
      data: invitation,
    });
  } catch (error) {
    next(error);
  }
};

export const cancelInvitation = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const invitationId = Number(
      req.params.id,
    );

    if (Number.isNaN(invitationId)) {
      throw new AppError(
        "Invalid invitation ID",
        400,
      );
    }

    const organizationId =
      req.user.organization_id;

    const invitation =
      await userService.cancelInvitation(
        invitationId,
        organizationId,
      );

    return res.status(200).json({
      status: "success",
      message: "Invitation cancelled successfully",
      data: invitation,
    });
  } catch (error) {
    next(error);
  }
};

export const getMyProfile = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const user = await userService.getMyProfile(
      req.user.id,
    );

    return res.status(200).json({
      status: "success",
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

export const updateMyProfile = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { fullName, phone, profilePic } =
      req.body;

    const user = await userService.updateMyProfile(
      req.user.id,
      {
        fullName,
        phone,
        profilePic,
      },
    );

    return res.status(200).json({
      status: "success",
      message: "Profile updated successfully",
      data: user,
    });
  } catch (error) {
    next(error);
  }
};