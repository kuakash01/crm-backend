"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateRolePermissions = exports.getRolePermissions = exports.deleteRole = exports.updateRole = exports.createRole = exports.getRoles = void 0;
const db_1 = require("../../config/db");
const AppError_1 = require("../../shared/errors/AppError");
const getRoles = async (organizationId) => {
    const result = await db_1.pool.query(`
    SELECT
      id,
      name,
      description,
      created_at
    FROM roles
    WHERE organization_id = $1
    ORDER BY name ASC
    `, [organizationId]);
    return result.rows;
};
exports.getRoles = getRoles;
const createRole = async (organizationId, data) => {
    const result = await db_1.pool.query(`
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
    `, [
        data.name,
        data.description ?? null,
        organizationId,
    ]);
    return result.rows[0];
};
exports.createRole = createRole;
const updateRole = async (roleId, organizationId, data) => {
    const result = await db_1.pool.query(`
    UPDATE roles
    SET
      name = COALESCE($1,name),
      description = COALESCE($2,description)
    WHERE
      id = $3
      AND organization_id = $4
    RETURNING *
    `, [
        data.name,
        data.description,
        roleId,
        organizationId,
    ]);
    if (!result.rows.length) {
        throw new AppError_1.AppError("Role not found", 404);
    }
    return result.rows[0];
};
exports.updateRole = updateRole;
const deleteRole = async (roleId, organizationId) => {
    const usersAssigned = await db_1.pool.query(`
      SELECT COUNT(*)::int AS count
      FROM users
      WHERE role_id = $1
      `, [roleId]);
    if (usersAssigned.rows[0].count > 0) {
        throw new AppError_1.AppError("Role is assigned to users", 400);
    }
    await db_1.pool.query(`
    DELETE FROM roles
    WHERE
      id = $1
      AND organization_id = $2
    `, [
        roleId,
        organizationId,
    ]);
    return true;
};
exports.deleteRole = deleteRole;
const getRolePermissions = async (roleId, organizationId) => {
    const roleResult = await db_1.pool.query(`
        SELECT
          id,
          name
        FROM roles
        WHERE
          id = $1
          AND organization_id = $2
        `, [
        roleId,
        organizationId,
    ]);
    if (!roleResult.rows.length) {
        throw new AppError_1.AppError("Role not found", 404);
    }
    const permissionsResult = await db_1.pool.query(`
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
        `, [roleId]);
    return {
        role: roleResult.rows[0],
        permissions: permissionsResult.rows,
    };
};
exports.getRolePermissions = getRolePermissions;
const updateRolePermissions = async (roleId, organizationId, permissionIds) => {
    const roleResult = await db_1.pool.query(`
        SELECT id
        FROM roles
        WHERE
          id = $1
          AND organization_id = $2
        `, [
        roleId,
        organizationId,
    ]);
    if (!roleResult.rows.length) {
        throw new AppError_1.AppError("Role not found", 404);
    }
    const client = await db_1.pool.connect();
    try {
        await client.query("BEGIN");
        await client.query(`
        DELETE FROM role_permissions
        WHERE role_id = $1
        `, [roleId]);
        for (const permissionId of permissionIds) {
            await client.query(`
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
          `, [
                roleId,
                permissionId,
            ]);
        }
        await client.query("COMMIT");
        return true;
    }
    catch (error) {
        await client.query("ROLLBACK");
        throw error;
    }
    finally {
        client.release();
    }
};
exports.updateRolePermissions = updateRolePermissions;
