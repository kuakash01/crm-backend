import { Request, Response, NextFunction } from "express";
import * as authService from "./auth.service";
import { COOKIE_SAME_SITE, COOKIE_SECURE, COOKIE_EXPIRES_DAYS } from "../../config/env";
import { AppError } from "../../shared/errors/AppError";

export const verifyEmail = async (
  req: Request,
  res: Response,
) => {
  try {
    const { email, otp } = req.body;

    const result = await authService.verifyEmail(
      email,
      otp,
    );

    res.cookie("accessToken", result.token, {
      httpOnly: true,
      secure:
        COOKIE_SECURE === "true",
      sameSite:
        COOKIE_SAME_SITE as
        | "lax"
        | "strict"
        | "none",
      maxAge:
        Number(COOKIE_EXPIRES_DAYS) *
        24 *
        60 *
        60 *
        1000,
    });

    return res.status(200).json({
      success: true,
      message: "Email verified successfully",
      data: {
        user: result.user,
      },
    });
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }

    console.error(
      "Error in verifyEmail controller:",
      error,
    );

    return res.status(500).json({
      success: false,
      message: "Failed to verify email",
    });
  }
};



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
  next: NextFunction,
) => {
  try {
    const { email, password } = req.body;

    const user = await authService.login(
      email,
      password,
    );

    res.cookie("accessToken", user.token, {
      httpOnly: true,
      secure: COOKIE_SECURE === "true",
      sameSite:
        COOKIE_SAME_SITE as
        | "lax"
        | "strict"
        | "none",
      maxAge:
        Number(COOKIE_EXPIRES_DAYS) *
        24 *
        60 *
        60 *
        1000,
    });

    return res.status(200).json({
      status: "success",
      message: "Login successful",
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
      secure: COOKIE_SECURE === "true",
      sameSite: COOKIE_SAME_SITE as
        | "lax"
        | "strict"
        | "none",
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


export const getInvitationDetails = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { token } = req.query;

    if (
      typeof token !== "string" ||
      !token
    ) {
      throw new AppError(
        "Invalid invitation token",
        400,
      );
    }

    const invitation =
      await authService.getInvitationDetails(
        token,
      );

    return res.status(200).json({
      status: "success",
      data: invitation,
    });
  } catch (error) {
    next(error);
  }
};

export const acceptInvitation = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { token, password } = req.body;

    const result =
      await authService.acceptInvitation(
        token,
        password,
      );

    res.cookie("accessToken", result.token, {
      httpOnly: true,
      secure: COOKIE_SECURE === "true",
      sameSite:
        COOKIE_SAME_SITE as
        | "lax"
        | "strict"
        | "none",
      maxAge:
        Number(COOKIE_EXPIRES_DAYS) *
        24 *
        60 *
        60 *
        1000,
    });

    return res.status(200).json({
      status: "success",
      message: "Invitation accepted successfully",
      data: {
        user: result.user,
      },
    });
  } catch (error) {
    next(error);
  }
};


export const forgotPassword = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { email } = req.body;

    await authService.forgotPassword(email);

    return res.status(200).json({
      status: "success",
      message:
        "If an account exists for this email, a verification code has been sent.",
    });
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const {
      email,
      otp,
      newPassword,
    } = req.body;

    await authService.resetPassword(
      email,
      otp,
      newPassword,
    );

    return res.status(200).json({
      status: "success",
      message:
        "Password reset successfully. You can now sign in.",
    });
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const {
      currentPassword,
      newPassword,
    } = req.body;

    await authService.changePassword(
      req.user.id,
      currentPassword,
      newPassword,
    );

    return res.status(200).json({
      status: "success",
      message:
        "Password changed successfully",
    });
  } catch (error) {
    next(error);
  }
};



// export const verifyLoginOtp = async (
//   req: Request,
//   res: Response,
//   next: NextFunction,
// ) => {
//   try {
//     const { userId, otp } = req.body;

//     const result =
//       await authService.verifyLoginOtp(
//         userId,
//         otp,
//       );

//     res.cookie("accessToken", result.token, {
//       httpOnly: true,
//       secure: COOKIE_SECURE === "true",
//       sameSite:
//         COOKIE_SAME_SITE as
//         | "lax"
//         | "strict"
//         | "none",
//       maxAge:
//         Number(COOKIE_EXPIRES_DAYS) *
//         24 *
//         60 *
//         60 *
//         1000,
//     });

//     return res.status(200).json({
//       status: "success",
//       message: "Login successful",
//       data: {
//         user: result.user,
//       },
//     });
//   } catch (error) {
//     next(error);
//   }
// };
