import { Request, Response, NextFunction } from "express";
import { AppError } from "../../shared/errors/AppError";
import { updateOrganizationSchema } from "./organizations.schema";
import * as organizationService from "./organizations.service";

export const getMyOrganization = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const organization = await organizationService.getOrganization(
      req.user.organization_id
    );

    res.status(200).json({
      status: "success",
      data: organization,
    });
  } catch (error) {
    next(error);
  }
};

export const updateMyOrganization = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const parsed = updateOrganizationSchema.safeParse(req.body);

    if (!parsed.success) {
      throw new AppError(
        parsed.error.issues[0]?.message ?? "Invalid organization data",
        400
      );
    }

    const organization = await organizationService.updateOrganization(
      req.user.organization_id,
      parsed.data
    );

    res.status(200).json({
      status: "success",
      message: "Organization details updated successfully",
      data: organization,
    });
  } catch (error) {
    next(error);
  }
};

export const regenerateInboundKey = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await organizationService.regenerateInboundKey(
      req.user.organization_id
    );
    res.status(200).json({
      status: "success",
      message: "Inbound API key regenerated successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
