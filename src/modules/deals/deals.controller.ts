import { Request, Response, NextFunction } from "express";
import * as dealsService from "./deals.service";

export const createDeal = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {

    const deal =
      await dealsService.createDeal(
        req.user.organization_id,
        req.user.id,
        req.body
      );

    res.status(201).json({
      status: "success",
      data: deal,
    });

  } catch (error) {
    next(error);
  }
};

export const getDeals = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {

  try {

    const result =
      await dealsService.getDeals(
        req.user.organization_id,
        req.user.id,
        req.user.role,
        {
          stage: req.query.stage as string,
          customerId: req.query.customerId
            ? Number(req.query.customerId)
            : undefined,
          serviceId: req.query.serviceId
            ? Number(req.query.serviceId)
            : undefined,
          search: req.query.search as string,
        }
      );

    res.status(200).json({
      status: "success",
      data: result.deals,
      counts: result.counts,
    });

  } catch (error) {

    next(error);

  }

};

export const getDealById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {

  try {

    const deal =
      await dealsService.getDealById(
        Number(req.params.id),
        req.user.organization_id,
        req.user.id,
        req.user.role
      );

    res.status(200).json({
      status: "success",
      data: deal
    });

  } catch (error) {
    next(error);
  }

};

export const updateDeal = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {

  try {

    const deal =
      await dealsService.updateDeal(
        Number(req.params.id),
        req.user.organization_id,
        req.user.id,
        req.user.role,
        req.body
      );

    res.status(200).json({
      status: "success",
      data: deal
    });

  } catch (error) {

    next(error);

  }

};

export const updateDealStage = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {

  try {

    const deal =
      await dealsService.updateDealStage(
        Number(req.params.id),
        req.user.organization_id,
        req.user.id,
        req.body.stage
      );

    res.status(200).json({
      status: "success",
      data: deal
    });

  } catch (error) {

    next(error);

  }

};

export const deleteDeal = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {

  try {

    await dealsService.deleteDeal(
      Number(req.params.id),
      req.user.organization_id,
      req.user.id
    );

    res.status(200).json({
      status: "success"
    });

  } catch (error) {

    next(error);

  }

};

export const assignDeals = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {

  try {

    const result =
      await dealsService.assignDeals(
        req.user.organization_id,
        req.user.id,
        req.body.dealIds,
        req.body.assignedTo
      );

    res.status(200).json({
      status: "success",
      data: result,
    });

  } catch (error) {

    next(error);

  }

};