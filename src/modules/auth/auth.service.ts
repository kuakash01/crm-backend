import { UserDetails } from "./auth.types";
import { pool } from "../../config/db";
import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";
import { AppError } from "../../shared/errors/AppError";
import {
  JWT_SECRET,
  JWT_EXPIRES_IN,
  BCRYPT_SALT_ROUNDS
} from "../../config/env";

// register function to create a new user in the database
export const register = async (
  userData: UserDetails
) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const existingUser = await client.query(
      "SELECT id FROM users WHERE email = $1",
      [userData.email]
    );

    if (existingUser.rows.length > 0) {
      throw new AppError("Email already in use", 409);
    }

    const hashedPassword = await bcryptjs.hash(
      userData.password,
      BCRYPT_SALT_ROUNDS
        ? parseInt(BCRYPT_SALT_ROUNDS)
        : 10
    );

    // 1. Create Organization
    const organizationResult =
      await client.query(
        `
        INSERT INTO organizations (name)
        VALUES ($1)
        RETURNING id
        `,
        [userData.organizationName]
      );

    const organizationId =
      organizationResult.rows[0].id;

    // 2. Create Admin Role
    const adminRoleResult = await client.query(
      `INSERT INTO roles(organization_id, name, description) VALUES ($1, $2, $3) RETURNING *;`,
      [organizationId, "admin", `admin of organization '${userData.organizationName}'`]
    )
    const roleId = adminRoleResult.rows[0].id;

    // 3. Create Admin User
    const userResult = await client.query(
      `
      INSERT INTO users (
        organization_id,
        fullName,
        email,
        password,
        role_id
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING
        id,
        organization_id,
        fullName,
        email,
        role_id
      `,
      [
        organizationId,
        userData.fullName,
        userData.email,
        hashedPassword,
        roleId,
      ]
    );

    // 4. give all permissions to admin
    await client.query(`
      INSERT INTO role_permissions(role_id, permission_id) SELECT r.id, p.id FROM roles r CROSS JOIN permissions p WHERE r.id = $1;`, [roleId])


    await client.query("COMMIT");

    return userResult.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error in register function:", error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError("Failed to register user", 500);
  } finally {
    client.release();
  }
};


// login function to authenticate user and return user details
export const login = async (
  email: string,
  password: string
) => {
  try {
    const result = await pool.query(
      `
    SELECT u.id, u.email, r.name as role, u.organization_id, u.password
    FROM users u JOIN roles r on u.role_id = r.id
    WHERE u.email = $1 AND is_active = TRUE
    `,
      [email]
    );


    const user = result.rows[0];

    if (!user) {
      throw new AppError("Invalid credentials", 401);
    }

    const isMatch = await bcryptjs.compare(password, user.password);

    if (!isMatch) {
      throw new AppError("Invalid credentials", 401);
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        organizationId: user.organization_id,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );
    // console.log("token", token);


    return {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      token,
    };
  } catch (error) {
    console.log("error in login", error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError("Failed to login user", 500);
  }
};

export const logout = async (
  userId: number,
  organization_id: number
) => {
  return;
}

export const getCurrentUser = async (
  userId: number
) => {
  const userResult =
    await pool.query(
      `
      SELECT
        u.id,
        u.fullname,
        u.email,
        r.id as role_id,
        r.name as role,
        u.organization_id
      FROM users u
      JOIN roles r
        ON u.role_id = r.id
      WHERE u.id = $1
      `,
      [userId]
    );

  if (!userResult.rows.length) {
    throw new AppError(
      "User not found",
      404
    );
  }

  const user =
    userResult.rows[0];

  const permissionsResult =
    await pool.query(
      `
      SELECT
        m.name as module,
        p.action
      FROM role_permissions rp

      JOIN permissions p
        ON rp.permission_id = p.id

      JOIN modules m
        ON p.module_id = m.id

      WHERE rp.role_id = $1
      `,
      [user.role_id]
    );

  const permissions =
    permissionsResult.rows.map(
      (permission) =>
        `${permission.module}:${permission.action}`
    );

  return {
    ...user,
    permissions,
  };
};