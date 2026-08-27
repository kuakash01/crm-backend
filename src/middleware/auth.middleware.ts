// middleware/auth.middleware.ts

import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AppError } from "../shared/errors/AppError";
import { pool } from "../config/db";
import { JWT_SECRET } from "../config/env";


// export const verifyToken = async (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ) => {
//   try {
//     const token =
//       req.cookies.accessToken;

//     if (!token) {
//       return res.status(401).json({
//         message: "Unauthorized",
//       });
//     }

//     const decoded = jwt.verify(
//       token,
//       JWT_SECRET
//     ) as {
//       id: number;
//     };

//     const result =
//       await pool.query(
//         `
//         SELECT
//           u.id,
//           u.fullname,
//           u.email,
//           u.organization_id,
//           u.role_id,
//           r.name as role,

//           COALESCE(
//             ARRAY_AGG(
//               DISTINCT
//               m.name || ':' || p.action
//             )
//             FILTER (
//               WHERE p.id IS NOT NULL
//             ),
//             '{}'
//           ) AS permissions

//         FROM users u

//         LEFT JOIN role_permissions rp
//           ON rp.role_id = u.role_id

//         LEFT JOIN permissions p
//           ON p.id = rp.permission_id

//         LEFT JOIN modules m
//           ON m.id = p.module_id

//         LEFT JOIN roles r
//           on r.id = u.role_id

//         WHERE u.id = $1 AND is_Active = TRUE

//         GROUP BY
//           u.id,
//           u.email,
//           u.fullname,
//           u.organization_id,
//           u.role_id,
//           r.name
//         `,
//         [decoded.id]
//       );

//     if (!result.rows.length) {
//       return res.status(401).json({
//         message:
//           "User no longer exists",
//       });
//     }

//     req.user =
//       result.rows[0];
//     // res.status(200).json({status:"success", message:"verifyToken", user:req.user});

//     next();

//   } catch (error) {

//     return res.status(401).json({
//       message: "Invalid token",
//     });

//   }
// };


export const authenticateUser = async (
  token: string
) => {
  const decoded = jwt.verify(
    token,
    JWT_SECRET
  ) as {
    id: number;
  };

  const result = await pool.query(
    `
    SELECT
      u.id,
      u.fullname,
      u.email,
      u.organization_id,
      u.role_id,
      r.name AS role,

      COALESCE(
        ARRAY_AGG(
          DISTINCT
          m.name || ':' || p.action
        )
        FILTER (
          WHERE p.id IS NOT NULL
        ),
        '{}'
      ) AS permissions

    FROM users u

    LEFT JOIN role_permissions rp
      ON rp.role_id = u.role_id

    LEFT JOIN permissions p
      ON p.id = rp.permission_id

    LEFT JOIN modules m
      ON m.id = p.module_id

    LEFT JOIN roles r
      ON r.id = u.role_id

    WHERE
      u.id = $1
      AND u.is_active = TRUE

    GROUP BY
      u.id,
      u.email,
      u.fullname,
      u.organization_id,
      u.role_id,
      r.name
    `,
    [decoded.id]
  );

  if (!result.rows.length) {
    throw new Error("User no longer exists");
  }

  return result.rows[0];
};


export const verifyToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.cookies.accessToken;

    if (!token) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const user = await authenticateUser(token);

    req.user = user;

    next();
  } catch (error) {
    return res.status(401).json({
      message: "Invalid token",
    });
  }
};

export const authorize =
  (module: string, action: string) =>
    (
      req: Request,
      res: Response,
      next: NextFunction
    ) => {

      const permission =
        `${module}:${action}`;

      if (
        !req.user.permissions.includes(
          permission
        )
      ) {
        return res.status(403).json({
          message: "Permission denied",
        });
      }

      next();
    };







// import { Request, Response, NextFunction } from "express";
// import jwt from "jsonwebtoken";
// import { AppError } from "../shared/errors/AppError";
// import { pool } from "../config/db";
// import { JWT_SECRET } from "../config/env";



// export const authenticateUser = async (userId: number) => {


//   const result = await pool.query(
//     `
//     SELECT
//       u.id,
//       u.fullname,
//       u.email,
//       u.organization_id,
//       u.role_id,
//       r.name AS role
//     FROM users u
//     LEFT JOIN roles r
//       ON r.id = u.role_id
//     WHERE u.id = $1
//       AND u.is_active = TRUE
//     `,
//     [userId]
//   );

//   if (!result.rows.length) {
//     throw new Error("User no longer exists");
//   }

//   return result.rows[0];
// };


// export const getUserPermissions = async (
//   userId: number
// ) => {
//   const result = await pool.query(
//     `
//     SELECT DISTINCT
//       m.name || ':' || p.action AS permission
//     FROM role_permissions rp
//     JOIN permissions p
//       ON p.id = rp.permission_id
//     JOIN modules m
//       ON m.id = p.module_id
//     JOIN users u
//       ON u.role_id = rp.role_id
//     WHERE u.id = $1
//     `,
//     [userId]
//   );

//   return result.rows.map(
//     (row) => row.permission
//   );
// };

// export const verifyToken = async (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ) => {
//   try {
//     const token = req.cookies.accessToken;

//     if (!token) {
//       return res.status(401).json({
//         message: "Unauthorized",
//       });
//     }

//     const decoded = jwt.verify(token, JWT_SECRET) as {
//       id: number;
//     };

//     const user = await authenticateUser(decoded.id);

//     req.user = user;

//     next();
//   } catch {
//     return res.status(401).json({
//       message: "Invalid token",
//     });
//   }
// };


// export const authorize =
//   (module: string, action: string) =>
//     async (
//       req: Request,
//       res: Response,
//       next: NextFunction
//     ) => {
//       try {
//         const permissions =
//           await getUserPermissions(
//             req.user.id
//           );

//         const permission =
//           `${module}:${action}`;

//         if (!permissions.includes(permission)) {
//           return res.status(403).json({
//             message: "Permission denied",
//           });
//         }

//         next();
//       } catch {
//         return res.status(500).json({
//           message: "Authorization failed",
//         });
//       }
//     };