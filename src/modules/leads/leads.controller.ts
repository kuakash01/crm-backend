import { Response, Request, NextFunction } from "express";
import * as leadsService from "./leads.service";
import { hasPermission } from "../auth/auth.helper";
import { inboundLeadSchema } from "./inboundLead.schema";

export const getLeads = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const leads = await leadsService.getLeads(
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
      hasPermission(
        req.user.permissions,
        "leads:view_unassigned"
      )
    );
    res.status(200).json({ message: "leads fetch successfully", data: leads });
  } catch (error) {
    next(error)
  }
};

export const createLead = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // return res.status(200).json({ status: "testing", req: req.user });
    const lead = await leadsService.createLead(
      req.user.organization_id,
      req.user.id,
      req.body
    );
    res.status(200).json({ message: "leads created successfully", data: lead });
  } catch (error) {
    next(error)
  }
};

export const capturePublicLead = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const headerKey = req.headers["x-inbound-key"] as string | undefined;
    const bodyData = {
      ...req.body,
      fname: req.body.fname || req.body.firstName,
      lname: req.body.lname || req.body.lastName,
      phone1: req.body.phone1 || req.body.phone,
      key: req.body.key || headerKey || undefined,
    };
    const validatedData = inboundLeadSchema.parse(bodyData);
    const result = await leadsService.createInboundLead(validatedData);
    res.status(201).json({
      success: true,
      message: "Inquiry received successfully. Our team will get in touch shortly.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const getLeadById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const lead = await leadsService.getLeadById(
      Number(req.params.id),
      req.user.organization_id
    );

    res.status(200).json({
      message: "Lead fetched successfully",
      data: lead,
    });
  } catch (error) {
    next(error);
  }
};


export const updateLeadDetails = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const lead = await leadsService.updateLeadDetails(
      Number(req.params.id),
      Number(req.user.id),
      Number(req.user.organization_id),
      req.user.role,
      req.body
    );

    res.status(200).json({
      message: "Lead updated successfully",
      data: lead,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteLead = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    await leadsService.deleteLead(
      Number(req.params.id),
      req.user.organization_id
    );

    res.status(200).json({
      message: "Lead deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};


export const assignLeads = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { leadIds, assignedTo } =
      req.body;

    await leadsService.assignLeads(
      req.user.id,
      req.user.fullname,
      leadIds,
      assignedTo
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


export const updateLeadStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { status } = req.body;

    const lead =
      await leadsService.updateLeadStatus(
        Number(req.params.id),
        Number(req.user.id),
        Number(req.user.organization_id),
        status,
        req.user.fullname
      );

    res.status(200).json({
      status: "success",
      message:
        "Lead status updated successfully",
      data: lead,
    });
  } catch (error) {
    next(error);
  }
};


export const getLeadOptions = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const result =
      await leadsService.getLeadOptions(
        req.user.organization_id,
        req.user.id,
        {
          search:
            req.query.search
              ?.toString(),

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
          "leads:view_unassigned"
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