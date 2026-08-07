import { Request, Response, NextFunction } from "express";
import * as customersService from "./customers.service";
import { hasPermission } from "../auth/auth.helper";

export const createCustomer = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {

  try {

    const customer =
      await customersService.createCustomer(
        req.user.organization_id,
        req.user.id,
        req.body
      );

    res.status(201).json({
      status: "success",
      data: customer
    });

  } catch (error) {

    next(error);

  }

};

export const getCustomers = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {

  try {

    const customers =
      await customersService.getCustomers(
        req.user.organization_id,
        req.user.id,
        {
          page: req.query.page
            ? Number(req.query.page)
            : 1,

          limit: req.query.limit
            ? Number(req.query.limit)
            : 10,

          status: req.query.status
            ?.toString()
            .toUpperCase(),

          search: req.query.search
            ?.toString()
        },

      );

    res.status(200).json({
      status: "success",
      data: customers
    });

  } catch (error) {

    next(error);

  }

};

export const getCustomerById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {

  try {

    const customer =
      await customersService.getCustomerById(
        req.user.organization_id,
        Number(req.params.id)
      );

    res.status(200).json({
      status: "success",
      data: customer
    });

  } catch (error) {

    next(error);

  }

};

export const updateCustomer = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {

  try {

    const customer =
      await customersService.updateCustomer(
        req.user.organization_id,
        Number(req.params.id),
        req.user.id,
        req.body
      );

    res.status(200).json({
      status: "success",
      data: customer
    });

  } catch (error) {

    next(error);

  }

};

export const updateCustomerStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {

  try {

    const customer =
      await customersService.updateCustomerStatus(
        req.user.organization_id,
        Number(req.params.id),
        req.body.status,
        req.user.id
      );

    res.status(200).json({
      status: "success",
      data: customer
    });

  } catch (error) {

    next(error);

  }

};

export const deleteCustomer = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {

  try {

    await customersService.deleteCustomer(
      req.user.organization_id,
      Number(req.params.id),
    );

    res.status(200).json({
      status: "success"
    });

  } catch (error) {

    next(error);

  }

};

export const assignCustomer = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { customerIds, assignedTo } =
      req.body;

    await customersService.assignCustomer(
      req.user.id,
      customerIds,
      assignedTo,
    );

    res.status(200).json({
      status: "success",
      message:
        "Leads assigned successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const getCustomerDeals = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {

  try {

    const deals =
      await customersService.getCustomerDeals(
        Number(req.params.id),
        req.user.organization_id
      );

    res.status(200).json({
      status: "success",
      data: deals
    });

  } catch (error) {

    next(error);

  }

};


export const getCustomerOptions = async (
  req: Request,
  res: Response
) => {
  const organizationId = req.user.organization_id;
  const currentUserId = req.user.id;

  const {
    q,
    page,
    limit,
  } = req.query;

  const customers = await customersService.getCustomerOptions(
    organizationId,
    currentUserId,
    {
      search: q as string,
      page: Number(page) || 1,
      limit: Number(limit) || 10,
    }
  );


  res.status(200).json({
    status: "success",
    data: customers,
    message: "Customer options fetched successfully"
  });

};