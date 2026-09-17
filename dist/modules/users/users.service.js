"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateMyProfile = exports.getMyProfile = exports.cancelInvitation = exports.resendInvitation = exports.getPendingInvitations = exports.getVisibleUserIds = exports.validateAssignee = exports.getAssignableUsers = exports.deleteUser = exports.changeStatus = exports.changeRole = exports.updateUser = exports.createUser = exports.getUser = exports.getUsers = void 0;
const db_1 = require("../../config/db");
const AppError_1 = require("../../shared/errors/AppError");
const notification_helper_1 = require("../notifications/notification.helper");
const crypto_1 = __importDefault(require("crypto"));
const env_1 = require("../../config/env");
const emailTemplates_1 = require("../../shared/helpers/emailTemplates");
const demo_helper_1 = require("../../shared/helpers/demo.helper");
const getUsers = async (organizationId) => {
    const result = await db_1.pool.query(`
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
      `, [organizationId]);
    return result.rows.map((u) => ({
        ...u,
        is_demo: (0, demo_helper_1.isDemoAccount)(u.email),
    }));
};
exports.getUsers = getUsers;
const getUser = async (id, organizationId) => {
    const result = await db_1.pool.query(`
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
      `, [id, organizationId]);
    if (!result.rows.length) {
        throw new AppError_1.AppError("User not found", 404);
    }
    return result.rows[0];
};
exports.getUser = getUser;
// export const createUser = async (
//   data: CreateUserDto,
//   organizationId: number
// ) => {
//   const hashedPassword =
//     await bcryptjs.hash(
//       data.password,
//       10
//     );
//   const result =
//     await pool.query(
//       `
//       INSERT INTO users
//       (
//         fullname,
//         email,
//         password,
//         phone,
//         role_id,
//         reports_to,
//         organization_id
//       )
//       VALUES
//       (
//         $1,$2,$3,$4,$5,$6,$7
//       )
//       RETURNING id
//       `,
//       [
//         data.fullName,
//         data.email,
//         hashedPassword,
//         data.phone,
//         data.roleId,
//         data.reports_to,
//         organizationId,
//       ]
//     );
//   return result.rows[0];
// };
const createUser = async (data, organizationId) => {
    const client = await db_1.pool.connect();
    try {
        await client.query("BEGIN");
        // 1. Check whether the email already belongs
        // to an existing user.
        const existingUser = await client.query(`
      SELECT id
      FROM users
      WHERE email = $1
      `, [data.email]);
        if (existingUser.rows.length > 0) {
            throw new AppError_1.AppError("Email already in use", 409);
        }
        // 2. Check whether there is already
        // an active invitation for this email.
        const existingInvitation = await client.query(`
        SELECT id
        FROM user_invitations
        WHERE
          organization_id = $1
          AND email = $2
          AND used_at IS NULL
          AND revoked_at IS NULL
          AND expires_at > NOW()
        LIMIT 1
        `, [organizationId, data.email]);
        if (existingInvitation.rows.length > 0) {
            throw new AppError_1.AppError("An active invitation already exists for this email", 409);
        }
        // 3. Generate a secure invitation token.
        const invitationToken = crypto_1.default
            .randomBytes(32)
            .toString("hex");
        // 4. Store only the token hash.
        const tokenHash = crypto_1.default
            .createHash("sha256")
            .update(invitationToken)
            .digest("hex");
        // 5. Store pending user information.
        const invitationResult = await client.query(`
        INSERT INTO user_invitations (
          organization_id,
          email,
          full_name,
          phone,
          role_id,
          reports_to,
          token_hash,
          expires_at
        )
        VALUES (
          $1,
          $2,
          $3,
          $4,
          $5,
          $6,
          $7,
          NOW() + INTERVAL '24 hours'
        )
        RETURNING
          id,
          email,
          full_name,
          phone,
          role_id,
          reports_to
        `, [
            organizationId,
            data.email,
            data.fullName,
            data.phone,
            data.roleId,
            data.reportsTo,
            tokenHash,
        ]);
        const invitation = invitationResult.rows[0];
        // 6. Commit database transaction.
        await client.query("COMMIT");
        // 7. Build frontend invitation URL.
        const invitationUrl = `${env_1.CORS_ORIGIN}/invite?token=${invitationToken}`;
        // 8. Send invitation email.
        await (0, emailTemplates_1.sendInvitationEmail)(invitation.email, invitationUrl);
        return {
            id: invitation.id,
            fullName: invitation.full_name,
            email: invitation.email,
        };
    }
    catch (error) {
        try {
            await client.query("ROLLBACK");
        }
        catch {
            // Transaction may already be committed.
        }
        if (error instanceof AppError_1.AppError) {
            throw error;
        }
        console.error("Error creating user invitation:", error);
        throw new AppError_1.AppError("Failed to create user invitation", 500);
    }
    finally {
        client.release();
    }
};
exports.createUser = createUser;
const updateUser = async (id, organizationId, data) => {
    const targetUser = await db_1.pool.query(`SELECT email FROM users WHERE id = $1 AND organization_id = $2`, [id, organizationId]);
    if (targetUser.rows.length && (0, demo_helper_1.isDemoAccount)(targetUser.rows[0].email)) {
        throw new AppError_1.AppError("Action disabled: Demo account is protected and cannot be modified.", 403);
    }
    await db_1.pool.query(`
    UPDATE users
    SET
      fullname = $1,
      phone = $2,
      reports_to = $3,
      role_id = $4
    WHERE
      id = $5
      AND
      organization_id = $6
    `, [
        data.fullName,
        data.phone,
        data.reportsTo,
        data.roleId,
        id,
        organizationId,
    ]);
};
exports.updateUser = updateUser;
const changeRole = async (id, roleId, organizationId, currentUserId) => {
    // Get user's current role
    const userResult = await db_1.pool.query(`
    SELECT
      u.role_id,
      u.email,
      r.name AS role_name
    FROM users u
    LEFT JOIN roles r
      ON r.id = u.role_id
    WHERE
      u.id = $1
      AND u.organization_id = $2
    `, [
        id,
        organizationId,
    ]);
    if (!userResult.rows.length) {
        throw new AppError_1.AppError("User not found", 404);
    }
    if ((0, demo_helper_1.isDemoAccount)(userResult.rows[0].email)) {
        throw new AppError_1.AppError("Action disabled: Role of demo account cannot be changed.", 403);
    }
    const oldRole = userResult.rows[0].role_name;
    // Get new role name
    const roleResult = await db_1.pool.query(`
    SELECT name
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
    const newRole = roleResult.rows[0].name;
    if (userResult.rows[0].role_id === roleId) {
        throw new AppError_1.AppError("User already has this role", 400);
    }
    await db_1.pool.query(`
    UPDATE users
    SET
      role_id = $1
    WHERE
      id = $2
      AND organization_id = $3
    `, [
        roleId,
        id,
        organizationId,
    ]);
    // Notify affected user
    if (id !== currentUserId) {
        await (0, notification_helper_1.createNotifications)({
            organizationId,
            userIds: [id],
            type: "USER",
            action: "UPDATED",
            title: "Role Updated",
            message: `Your role has been changed from ${oldRole} to ${newRole}.`,
            entityType: "USER",
            entityId: id,
        });
    }
};
exports.changeRole = changeRole;
const changeStatus = async (id, isActive, organizationId, currentUserId) => {
    const userResult = await db_1.pool.query(`
    SELECT
      is_active,
      fullname,
      email
    FROM users
    WHERE
      id = $1
      AND organization_id = $2
    `, [
        id,
        organizationId,
    ]);
    if (!userResult.rows.length) {
        throw new AppError_1.AppError("User not found", 404);
    }
    if (id === currentUserId && !isActive) {
        throw new AppError_1.AppError("You cannot deactivate your own account.", 400);
    }
    if ((0, demo_helper_1.isDemoAccount)(userResult.rows[0].email)) {
        throw new AppError_1.AppError("Action disabled: Demo account status cannot be changed.", 403);
    }
    const user = userResult.rows[0];
    if (user.is_active === isActive) {
        throw new AppError_1.AppError(`User is already ${isActive ? "active" : "inactive"}`, 400);
    }
    await db_1.pool.query(`
    UPDATE users
    SET
      is_active = $1
    WHERE
      id = $2
      AND organization_id = $3
    `, [
        isActive,
        id,
        organizationId,
    ]);
    // Notify the affected user
    if (id !== currentUserId) {
        await (0, notification_helper_1.createNotifications)({
            organizationId,
            userIds: [id],
            type: "USER",
            action: "UPDATED",
            title: "Account Status Changed",
            message: `Your account has been ${isActive ? "activated" : "deactivated"}.`,
            entityType: "USER",
            entityId: id,
        });
    }
};
exports.changeStatus = changeStatus;
const deleteUser = async (id, organizationId) => {
    const targetUser = await db_1.pool.query(`SELECT email FROM users WHERE id = $1 AND organization_id = $2`, [id, organizationId]);
    if (targetUser.rows.length && (0, demo_helper_1.isDemoAccount)(targetUser.rows[0].email)) {
        throw new AppError_1.AppError("Action disabled: Demo accounts cannot be deleted.", 403);
    }
    await db_1.pool.query(`
    DELETE FROM users
    WHERE
      id = $1
      AND
      organization_id = $2
    `, [
        id,
        organizationId,
    ]);
};
exports.deleteUser = deleteUser;
// helpers
const getAssignableUsers = async (userId) => {
    const result = await db_1.pool.query(`
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
        `, [userId]);
    return result.rows;
};
exports.getAssignableUsers = getAssignableUsers;
const validateAssignee = async (currentUserId, assignedTo, db = db_1.pool) => {
    const currentUserResult = await db.query(`
    SELECT organization_id
    FROM users
    WHERE id = $1
    `, [currentUserId]);
    if (!currentUserResult.rows.length) {
        throw new AppError_1.AppError("User not found", 404);
    }
    const organizationId = currentUserResult.rows[0].organization_id;
    const assigneeResult = await db.query(`
    SELECT organization_id
    FROM users
    WHERE
      id = $1
      AND is_active = TRUE
    `, [assignedTo]);
    if (!assigneeResult.rows.length) {
        throw new AppError_1.AppError("Assignee not found", 404);
    }
    if (assigneeResult.rows[0].organization_id !==
        organizationId) {
        throw new AppError_1.AppError("Invalid assignee", 403);
    }
    const visibleUserIds = await (0, exports.getVisibleUserIds)(currentUserId, db);
    if (!visibleUserIds.includes(assignedTo)) {
        throw new AppError_1.AppError("You cannot assign to this user", 403);
    }
};
exports.validateAssignee = validateAssignee;
const getVisibleUserIds = async (currentUserId, db = db_1.pool) => {
    const result = await db.query(`
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
    `, [currentUserId]);
    return result.rows.map(row => row.id);
};
exports.getVisibleUserIds = getVisibleUserIds;
const getPendingInvitations = async (organizationId) => {
    const result = await db_1.pool.query(`
    SELECT
      ui.id,
      ui.full_name,
      ui.email,
      ui.phone,
      ui.expires_at,
      ui.created_at,
      r.name AS role,
      rt.fullname AS reports_to
    FROM user_invitations ui

    JOIN roles r
      ON ui.role_id = r.id

    LEFT JOIN users rt
      ON ui.reports_to = rt.id

    WHERE
      ui.organization_id = $1
      AND ui.used_at IS NULL
      AND ui.revoked_at IS NULL

    ORDER BY ui.created_at DESC
    `, [organizationId]);
    return result.rows.map((invitation) => ({
        id: invitation.id,
        fullName: invitation.full_name,
        email: invitation.email,
        phone: invitation.phone,
        role: invitation.role,
        reportsTo: invitation.reports_to,
        expiresAt: invitation.expires_at,
        createdAt: invitation.created_at,
        status: new Date(invitation.expires_at) < new Date()
            ? "expired"
            : "pending",
    }));
};
exports.getPendingInvitations = getPendingInvitations;
const resendInvitation = async (invitationId, organizationId) => {
    const client = await db_1.pool.connect();
    try {
        await client.query("BEGIN");
        const result = await client.query(`
      SELECT
        ui.*,
        o.name AS organization,
        r.name AS role
      FROM user_invitations ui
      JOIN organizations o
        ON ui.organization_id = o.id
      JOIN roles r
        ON ui.role_id = r.id
      WHERE
        ui.id = $1
        AND ui.organization_id = $2
        AND ui.used_at IS NULL
        AND ui.revoked_at IS NULL
      FOR UPDATE
      `, [invitationId, organizationId]);
        if (result.rows.length === 0) {
            throw new AppError_1.AppError("Invitation not found", 404);
        }
        const invitation = result.rows[0];
        const invitationToken = crypto_1.default
            .randomBytes(32)
            .toString("hex");
        const tokenHash = crypto_1.default
            .createHash("sha256")
            .update(invitationToken)
            .digest("hex");
        // Revoke old invitation
        await client.query(`
      UPDATE user_invitations
      SET revoked_at = NOW()
      WHERE id = $1
      `, [invitation.id]);
        // Create new invitation
        const newInvitation = await client.query(`
        INSERT INTO user_invitations (
          organization_id,
          email,
          full_name,
          phone,
          role_id,
          reports_to,
          token_hash,
          expires_at
        )
        VALUES (
          $1, $2, $3, $4, $5, $6, $7,
          NOW() + INTERVAL '24 hours'
        )
        RETURNING id
        `, [
            invitation.organization_id,
            invitation.email,
            invitation.full_name,
            invitation.phone,
            invitation.role_id,
            invitation.reports_to,
            tokenHash,
        ]);
        await client.query("COMMIT");
        const invitationUrl = `${env_1.CORS_ORIGIN}/invite?token=${invitationToken}`;
        await (0, emailTemplates_1.sendInvitationEmail)(invitation.email, invitationUrl);
        return {
            id: newInvitation.rows[0].id,
        };
    }
    catch (error) {
        try {
            await client.query("ROLLBACK");
        }
        catch { }
        if (error instanceof AppError_1.AppError) {
            throw error;
        }
        throw new AppError_1.AppError("Failed to resend invitation", 500);
    }
    finally {
        client.release();
    }
};
exports.resendInvitation = resendInvitation;
const cancelInvitation = async (invitationId, organizationId) => {
    const result = await db_1.pool.query(`
    UPDATE user_invitations
    SET revoked_at = NOW()
    WHERE
      id = $1
      AND organization_id = $2
      AND used_at IS NULL
      AND revoked_at IS NULL
    RETURNING id
    `, [invitationId, organizationId]);
    if (result.rows.length === 0) {
        throw new AppError_1.AppError("Invitation not found", 404);
    }
    return result.rows[0];
};
exports.cancelInvitation = cancelInvitation;
const getMyProfile = async (userId) => {
    const result = await db_1.pool.query(`
    SELECT
      u.id,
      u.fullname,
      u.email,
      u.phone,
      u.profile_pic,
      u.email_verified,
      u.is_active,
      u.organization_id,
      o.name AS organization,
      u.role_id,
      r.name AS role,
      u.reports_to,
      rt.fullname AS reports_to_name,
      u.created_at,
      u.updated_at
    FROM users u

    JOIN organizations o
      ON u.organization_id = o.id

    JOIN roles r
      ON u.role_id = r.id

    LEFT JOIN users rt
      ON u.reports_to = rt.id

    WHERE u.id = $1
    `, [userId]);
    if (result.rows.length === 0) {
        throw new AppError_1.AppError("User profile not found", 404);
    }
    const user = result.rows[0];
    return {
        id: user.id,
        fullName: user.fullname,
        email: user.email,
        phone: user.phone,
        profilePic: user.profile_pic,
        emailVerified: user.email_verified,
        isActive: user.is_active,
        organizationId: user.organization_id,
        organization: user.organization,
        roleId: user.role_id,
        role: user.role,
        reportsTo: user.reports_to,
        reportsToName: user.reports_to_name,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
        isDemo: (0, demo_helper_1.isDemoAccount)(user.email),
    };
};
exports.getMyProfile = getMyProfile;
const updateMyProfile = async (userId, data) => {
    const userCheck = await db_1.pool.query(`SELECT email FROM users WHERE id = $1`, [userId]);
    if (userCheck.rows.length && (0, demo_helper_1.isDemoAccount)(userCheck.rows[0].email)) {
        throw new AppError_1.AppError("Action disabled: Demo account profile is locked to preserve portfolio presentation.", 403);
    }
    const result = await db_1.pool.query(`
    UPDATE users
    SET
      fullname = $1,
      phone = $2,
      profile_pic = $3,
      updated_at = NOW()
    WHERE id = $4
    RETURNING
      id,
      fullname,
      email,
      phone,
      profile_pic,
      updated_at
    `, [
        data.fullName,
        data.phone,
        data.profilePic ?? null,
        userId,
    ]);
    if (result.rows.length === 0) {
        throw new AppError_1.AppError("User profile not found", 404);
    }
    const user = result.rows[0];
    return {
        id: user.id,
        fullName: user.fullname,
        email: user.email,
        phone: user.phone,
        profilePic: user.profile_pic,
        updatedAt: user.updated_at,
    };
};
exports.updateMyProfile = updateMyProfile;
// export const userHasChildren = async (
//   userId: number
// ) => {
//   const result = await pool.query(
//     `
//     SELECT EXISTS (
//       SELECT 1
//       FROM users
//       WHERE reports_to = $1
//     ) AS has_children
//     `,
//     [userId]
//   );
//   return result.rows[0].has_children;
// };
