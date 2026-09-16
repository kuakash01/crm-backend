import { Request, Response, NextFunction } from "express";
import { universalSearch } from "./search.service";

export const searchWorkspace = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const query =
      (req.query.q as string) ||
      (req.query.query as string) ||
      "";

    const results = await universalSearch(
      req.user.organization_id,
      req.user.id,
      req.user.role,
      req.user.permissions || [],
      query
    );

    res.status(200).json({
      success: true,
      data: results,
    });
  } catch (error) {
    next(error);
  }
};
