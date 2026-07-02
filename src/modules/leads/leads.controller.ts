import { Response, Request, NextFunction } from "express";
import * as leadsService from "./leads.service";

export const getLeads = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // return res.status(200).json({"status":"testing", user:req.user})
    const leads = await leadsService.getLeads(
      req.user.organization_id,
      req.user.id, req.user.role,
      {
        status: (req.query.status)?.toString().toLocaleUpperCase(),
        search: (req.query.search)?.toString().toLocaleUpperCase()
      },
      req.user.permissions.includes(
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
    const lead = await leadsService.createLead(req.user.organization_id, req.user.id, req.user.fullname, req.body);
    res.status(200).json({ message: "leads created successfully", data: lead });
  } catch (error) {
    next(error)
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
      req.user.fullname,
      Number(req.user.organization_id),
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
        req.user.fullname,
        Number(req.user.organization_id),
        status
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


