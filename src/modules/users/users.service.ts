import { pool } from "../../config/db";
import { Pool, PoolClient } from "pg";
import { AppError } from "../../shared/errors/AppError"
import bcryptjs from "bcryptjs";
import { CreateUserDto } from "./users.types";

export const getUsers = async (
  organizationId: number
) => {

  const result =
    await pool.query(
      `
      SELECT
        u.id,
        u.fullname,
        u.email,
        u.phone,
        u.is_active,
        u.reports_to,
        r.name as role
      FROM users u

      JOIN roles r
        ON r.id = u.role_id

      WHERE
        u.organization_id = $1

      ORDER BY u.id DESC
      `,
      [organizationId]
    );

  return result.rows;
};

export const getUser = async (
  id: number,
  organizationId: number
) => {

  const result =
    await pool.query(
      `
      SELECT
        u.id,
        u.fullname,
        u.email,
        u.phone,
        u.is_active,
        u.role_id,
        u.reports_to,
        r.name as role
      FROM users u

      JOIN roles r
        ON r.id = u.role_id

      WHERE
        u.id = $1
        AND
        u.organization_id = $2
      `,
      [id, organizationId]
    );

  if (!result.rows.length) {
    throw new AppError(
      "User not found",
      404
    );
  }

  return result.rows[0];
};

export const createUser = async (
  data: CreateUserDto,
  organizationId: number
) => {

  const hashedPassword =
    await bcryptjs.hash(
      data.password,
      10
    );

  const result =
    await pool.query(
      `
      INSERT INTO users
      (
        fullname,
        email,
        password,
        phone,
        role_id,
        reports_to,
        organization_id
      )
      VALUES
      (
        $1,$2,$3,$4,$5,$6,$7
      )
      RETURNING id
      `,
      [
        data.fullName,
        data.email,
        hashedPassword,
        data.phone,
        data.roleId,
        data.reports_to,
        organizationId,
      ]
    );

  return result.rows[0];
};

export const updateUser = async (
  id: number,
  organizationId: number,
  data: any
) => {

  await pool.query(
    `
    UPDATE users
    SET
      fullname = $1,
      email = $2,
      phone = $3,
      reports_to = $4
    WHERE
      id = $5
      AND
      organization_id = $6
    `,
    [
      data.fullName,
      data.email,
      data.phone,
      data.reportsTo,
      id,
      organizationId,
    ]
  );
};

export const changeRole = async (
  id: number,
  roleId: number,
  organizationId: number
) => {

  await pool.query(
    `
    UPDATE users
    SET role_id = $1
    WHERE
      id = $2
      AND
      organization_id = $3
    `,
    [
      roleId,
      id,
      organizationId,
    ]
  );
};

export const changeStatus = async (
  id: number,
  isActive: boolean,
  organizationId: number
) => {

  await pool.query(
    `
    UPDATE users
    SET is_active = $1
    WHERE
      id = $2
      AND
      organization_id = $3
    `,
    [
      isActive,
      id,
      organizationId,
    ]
  );
};

export const deleteUser = async (
  id: number,
  organizationId: number
) => {



  await pool.query(
    `
    DELETE FROM users
    WHERE
      id = $1
      AND
      organization_id = $2
    `,
    [
      id,
      organizationId,
    ]
  );
};

// for froented get all descendent users
export const getAssignableUsers = async (
  userId: number) => {

  const result =
    await pool.query(
      `
       WITH RECURSIVE hierarchy AS (

    SELECT
        id,
        fullname,
        reports_to,
        role_id
    FROM users
    WHERE id = $1

    UNION ALL

    SELECT
        u.id,
        u.fullname,
        u.reports_to,
        u.role_id
    FROM users u
    INNER JOIN hierarchy h
        ON u.reports_to = h.id
)

SELECT
    h.id,
    h.fullname,
    r.name AS role
FROM hierarchy h
JOIN roles r
    ON r.id = h.role_id
ORDER BY
    r.name,
    h.fullname;
        `,
      [userId]
    );

  return result.rows;
};

export const validateAssignee = async (
  currentUserId: number,
  assignedTo: number,
  db: Pool | PoolClient = pool
) => {

  const currentUserResult = await db.query(
    `
    SELECT organization_id
    FROM users
    WHERE id = $1
    `,
    [currentUserId]
  );

  if (!currentUserResult.rows.length) {
    throw new AppError(
      "User not found",
      404
    );
  }

  const organizationId =
    currentUserResult.rows[0].organization_id;

  const assigneeResult = await db.query(
    `
    SELECT organization_id
    FROM users
    WHERE
      id = $1
      AND is_active = TRUE
    `,
    [assignedTo]
  );

  if (!assigneeResult.rows.length) {
    throw new AppError(
      "Assignee not found",
      404
    );
  }

  if (
    assigneeResult.rows[0].organization_id !==
    organizationId
  ) {
    throw new AppError(
      "Invalid assignee",
      403
    );
  }

  const visibleUserIds =
    await getVisibleUserIds(
      currentUserId,
      db
    );

  if (!visibleUserIds.includes(assignedTo)) {
    throw new AppError(
      "You cannot assign to this user",
      403
    );
  }

};

export const getVisibleUserIds = async (
  currentUserId: number,
  db: Pool | PoolClient = pool
) => {

  const result = await db.query(
    `
    WITH RECURSIVE hierarchy AS (

      SELECT id
      FROM users
      WHERE id = $1

      UNION ALL

      SELECT u.id
      FROM users u
      INNER JOIN hierarchy h
        ON u.reports_to = h.id
    )

    SELECT id
    FROM hierarchy
    `,
    [currentUserId]
  );

  return result.rows.map(
    row => row.id
  );

};

export const userHasChildren = async (
  userId: number
) => {

  const result = await pool.query(
    `
    SELECT EXISTS (
      SELECT 1
      FROM users
      WHERE reports_to = $1
    ) AS has_children
    `,
    [userId]
  );

  return result.rows[0].has_children;

};

