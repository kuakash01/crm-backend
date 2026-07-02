import { pool } from "../../config/db";
import { AppError } from "../../shared/errors/AppError";
import {
  CreateRoleDto,
  UpdateRoleDto,
} from "./roles.types";

export const getRoles = async (
  organizationId: number
) => {
  const result = await pool.query(
    `
    SELECT
      id,
      name,
      description,
      created_at
    FROM roles
    WHERE organization_id = $1
    ORDER BY name ASC
    `,
    [organizationId]
  );

  
  return result.rows;
};

export const createRole = async (
  organizationId: number,
  data: CreateRoleDto
) => {
  const result = await pool.query(
    `
    INSERT INTO roles
    (
      name,
      description,
      organization_id
    )
    VALUES
    (
      $1,
      $2,
      $3
    )
    RETURNING *
    `,
    [
      data.name,
      data.description ?? null,
      organizationId,
    ]
  );

  return result.rows[0];
};

export const updateRole = async (
  roleId: number,
  organizationId: number,
  data: UpdateRoleDto
) => {
  const result = await pool.query(
    `
    UPDATE roles
    SET
      name = COALESCE($1,name),
      description = COALESCE($2,description)
    WHERE
      id = $3
      AND organization_id = $4
    RETURNING *
    `,
    [
      data.name,
      data.description,
      roleId,
      organizationId,
    ]
  );

  if (!result.rows.length) {
    throw new AppError(
      "Role not found",
      404
    );
  }

  return result.rows[0];
};

export const deleteRole = async (
  roleId: number,
  organizationId: number
) => {
  const usersAssigned =
    await pool.query(
      `
      SELECT COUNT(*)::int AS count
      FROM users
      WHERE role_id = $1
      `,
      [roleId]
    );

  if (
    usersAssigned.rows[0].count > 0
  ) {
    throw new AppError(
      "Role is assigned to users",
      400
    );
  }

  await pool.query(
    `
    DELETE FROM roles
    WHERE
      id = $1
      AND organization_id = $2
    `,
    [
      roleId,
      organizationId,
    ]
  );

  return true;
};


export const getRolePermissions =
  async (
    roleId: number,
    organizationId: number
  ) => {

    const roleResult =
      await pool.query(
        `
        SELECT
          id,
          name
        FROM roles
        WHERE
          id = $1
          AND organization_id = $2
        `,
        [
          roleId,
          organizationId,
        ]
      );

    if (
      !roleResult.rows.length
    ) {
      throw new AppError(
        "Role not found",
        404
      );
    }

    const permissionsResult =
      await pool.query(
        `
        SELECT
          m.id AS module_id,
          m.name AS module_name,

          p.id AS permission_id,
          p.action,

          CASE
            WHEN rp.permission_id IS NOT NULL
            THEN true
            ELSE false
          END AS assigned

        FROM permissions p

        INNER JOIN modules m
          ON m.id = p.module_id

        LEFT JOIN role_permissions rp
          ON rp.permission_id = p.id
          AND rp.role_id = $1

        ORDER BY
          m.name,
          p.action
        `,
        [roleId]
      );

    return {
      role:
        roleResult.rows[0],
      permissions:
        permissionsResult.rows,
    };
  };

export const updateRolePermissions =
  async (
    roleId: number,
    organizationId: number,
    permissionIds: number[]
  ) => {

    const roleResult =
      await pool.query(
        `
        SELECT id
        FROM roles
        WHERE
          id = $1
          AND organization_id = $2
        `,
        [
          roleId,
          organizationId,
        ]
      );

    if (
      !roleResult.rows.length
    ) {
      throw new AppError(
        "Role not found",
        404
      );
    }

    const client =
      await pool.connect();

    try {

      await client.query(
        "BEGIN"
      );

      await client.query(
        `
        DELETE FROM role_permissions
        WHERE role_id = $1
        `,
        [roleId]
      );

      for (
        const permissionId of permissionIds
      ) {
        await client.query(
          `
          INSERT INTO role_permissions
          (
            role_id,
            permission_id
          )
          VALUES
          (
            $1,
            $2
          )
          `,
          [
            roleId,
            permissionId,
          ]
        );
      }

      await client.query(
        "COMMIT"
      );

      return true;

    } catch (error) {

      await client.query(
        "ROLLBACK"
      );

      throw error;

    } finally {

      client.release();

    }
  };  













