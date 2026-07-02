import { Request, Response, NextFunction } from "express";
import * as servicesService from "./services.service";

export const createService = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {

  try {

    const service =
      await servicesService.createService(
        req.user.organization_id,
        req.user.id,
        req.body
      );

    res.status(201).json({
      status: "success",
      data: service
    });

  } catch (error) {

    next(error);

  }

};

export const getServices = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {

  try {

    const services =
      await servicesService.getServices(
        req.user.organization_id,
        req.query.includeInactive === "true"
      );

    res.status(200).json({
      status: "success",
      data: services
    });

  } catch (error) {

    next(error);

  }

};

export const getServiceById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {

  try {

    const service =
      await servicesService.getServiceById(
        Number(req.params.id),
        req.user.organization_id
      );

    res.status(200).json({
      status: "success",
      data: service
    });

  } catch (error) {

    next(error);

  }

};

export const updateService = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {

  try {

    const service =
      await servicesService.updateService(
        Number(req.params.id),
        req.user.organization_id,
        req.user.id,
        req.body
      );

    res.status(200).json({
      status: "success",
      data: service
    });

  } catch (error) {

    next(error);

  }

};

export const deleteService = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {

  try {

    await servicesService.deleteService(
      Number(req.params.id),
      req.user.organization_id,
      req.user.id
    );

    res.status(200).json({
      status: "success",
      message: "Service deleted successfully"
    });

  } catch (error) {

    next(error);

  }

};