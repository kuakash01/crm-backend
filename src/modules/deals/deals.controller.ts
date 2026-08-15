import { Request, Response, NextFunction } from "express";
import * as dealsService from "./deals.service";
import { hasPermission } from "../auth/auth.helper";

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
        {
          page: req.query.page
            ? Number(req.query.page)
            : 1,

          limit: req.query.limit
            ? Number(req.query.limit)
            : 10,

          stage: req.query.stage
            ?.toString()
            .toUpperCase(),

          search: req.query.search
            ?.toString()
        },
        hasPermission(
          req.user.permissions,
          "leads:view_unassigned"
        )
      );

    res.status(200).json({
      status: "success",
      data: result
    });

  } catch (error) {

    next(error);

  }

};

export const getPipelineDeals = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {

    const deals =
      await dealsService.getPipelineDeals(
        Number(req.user.organization_id),
        req.user.id,
        hasPermission(
          req.user.permissions,
          "leads:view_unassigned"
        )
      );

    res.status(200).json({
      status: "success",
      data: deals,
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
        req.user.fullname,
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

export const getDealOptions = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const result =
      await dealsService.getDealOptions(
        req.user.organization_id,
        req.user.id,
        {
          search:
            req.query.search?.toString(),

          page:
            req.query.page
              ? Number(req.query.page)
              : 1,

          limit:
            req.query.limit
              ? Number(req.query.limit)
              : 10,
        },
        hasPermission(
          req.user.permissions,
          "deals:view_unassigned"
        )
      );

    res.status(200).json({
      status: "success",
      data: result,
    });
  } catch (error) {
    next(error);
  }
}; 