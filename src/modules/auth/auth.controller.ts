import { Request, Response, NextFunction } from "express";
import * as authService from "./auth.service";

import { NODE_ENV, COOKIE_EXPIRES_DAYS } from "../../config/env";


export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = await authService.register(req.body);

    res.status(201).json({ status: "success", message: "User registered successfully", data: user });
  }
  catch (error) {
    next(error);
  }
};


export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password } = req.body;

    const user = await authService.login(
      email,
      password
    );

    res.cookie("accessToken", user.token, {
      httpOnly: true,
      secure: NODE_ENV === "production",
      sameSite: NODE_ENV === "production" ? "none" : "lax",
      maxAge: Number(
        COOKIE_EXPIRES_DAYS
      ) *
        24 *
        60 *
        60 *
        1000,
    });

    res.status(200).json({
      status: "success",
      message: "Login successful"
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (
  req: Request,
  res: Response
) => {
  try {
    res.clearCookie("accessToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "none",
    });

    return res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to logout",
    });
  }

}

export const getCurrentUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user =
      await authService.getCurrentUser(
        req.user.id
      );

    res.status(200).json({
      status: "success",
      data: user,
    });
  } catch (error) {
    next(error);
  }
};