import { UserDetails } from "./auth.types";
import { pool } from "../../config/db";
import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";
import { AppError } from "../../shared/errors/AppError";
import crypto, { randomInt } from "crypto";
import {
  JWT_SECRET,
  JWT_EXPIRES_IN,
  BCRYPT_SALT_ROUNDS,
  OTP_PEPPER,
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_CALLBACK_URL,
} from "../../config/env";

import { verifyEmailTemplate, sendPasswordResetEmail, sendLoginOtpEmail } from "../../shared/helpers/emailTemplates"
import { isDemoAccount } from "../../shared/helpers/demo.helper";


export function generateOtp(): string {
  return randomInt(100000, 1000000).toString();
}

export function hashOtp(otp: string): string {
  return crypto
    .createHmac("sha256", OTP_PEPPER!)
    .update(otp)
    .digest("hex");
}

export const verifyEmail = async (
  email: string,
  otp: string,
) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 1. Find user
    const userResult = await client.query(
      `
      SELECT
        u.id,
        u.organization_id,
        u.fullname,
        u.email,
        u.role_id,
        u.email_verified,
        u.is_active,
        r.name AS role
      FROM users u
      JOIN roles r
        ON u.role_id = r.id
      WHERE u.email = $1
      `,
      [email],
    );
    console.log("otp verification: ", email);
    if (userResult.rows.length === 0) {
      throw new AppError(
        "Invalid verification request",
        400,
      );
    }

    const user = userResult.rows[0];

    // 2. Already verified
    if (user.email_verified) {
      throw new AppError(
        "Email is already verified",
        400,
      );
    }

    // 3. Account must be active
    if (!user.is_active) {
      throw new AppError(
        "Account is inactive",
        403,
      );
    }

    // 4. Find latest active verification OTP
    const challengeResult = await client.query(
      `
      SELECT
        id,
        otp_hash,
        expires_at,
        attempts,
        max_attempts
      FROM auth_otp_challenges
      WHERE
        user_id = $1
        AND purpose = 'EMAIL_VERIFICATION'
        AND consumed_at IS NULL
      ORDER BY created_at DESC
      LIMIT 1
      `,
      [user.id],
    );

    if (challengeResult.rows.length === 0) {
      throw new AppError(
        "Verification code is invalid or expired",
        400,
      );
    }

    const challenge = challengeResult.rows[0];

    // 5. Check expiration
    if (
      new Date(challenge.expires_at) <= new Date()
    ) {
      throw new AppError(
        "Verification code has expired",
        400,
      );
    }

    // 6. Check maximum attempts
    if (
      challenge.attempts >=
      challenge.max_attempts
    ) {
      throw new AppError(
        "Too many verification attempts. Please request a new code.",
        429,
      );
    }

    // 7. Hash submitted OTP
    const submittedOtpHash = hashOtp(otp);

    // 8. Compare OTP
    if (
      submittedOtpHash !== challenge.otp_hash
    ) {
      await client.query(
        `
        UPDATE auth_otp_challenges
        SET attempts = attempts + 1
        WHERE id = $1
        `,
        [challenge.id],
      );

      // The attempt increment must persist.
      await client.query("COMMIT");

      throw new AppError(
        "Invalid verification code",
        400,
      );
    }

    // 9. Mark email as verified
    await client.query(
      `
      UPDATE users
      SET
        email_verified = TRUE,
        updated_at = NOW()
      WHERE id = $1
      `,
      [user.id],
    );

    // 10. Consume OTP
    await client.query(
      `
      UPDATE auth_otp_challenges
      SET consumed_at = NOW()
      WHERE id = $1
      `,
      [challenge.id],
    );

    // 11. Commit DB changes
    await client.query("COMMIT");

    // 12. Create JWT using the same payload as login
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        organizationId: user.organization_id,
      },
      JWT_SECRET,
      {
        expiresIn: JWT_EXPIRES_IN,
      },
    );

    return {
      token,
      user: {
        id: user.id,
        organizationId: user.organization_id,
        fullName: user.fullname,
        email: user.email,
        role: user.role,
      },
    };
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch {
      // Transaction may already be committed.
    }

    if (error instanceof AppError) {
      throw error;
    }

    console.error(
      "Error in verifyEmail service:",
      error,
    );

    throw new AppError(
      "Failed to verify email",
      500,
    );
  } finally {
    client.release();
  }
};

// register function to create a new user in the database
export const register = async (
  userData: UserDetails,
) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const existingUser = await client.query(
      `
      SELECT
        id,
        organization_id,
        fullName,
        email,
        role_id,
        email_verified
      FROM users
      WHERE email = $1
      `,
      [userData.email],
    );

    /*
     * --------------------------------------------------
     * Existing user
     * --------------------------------------------------
     */
    if (existingUser.rows.length > 0) {
      const existing = existingUser.rows[0];

      /*
       * Email already belongs to a verified account
       */
      if (existing.email_verified) {
        throw new AppError(
          "Email already in use",
          409,
        );
      }

      /*
       * User exists but has not verified their email.
       *
       * Do NOT create another organization,
       * role, or user.
       *
       * Instead, invalidate the previous OTP
       * and issue a new one.
       */

      const otp = generateOtp();
      const otpHash = hashOtp(otp);

      // Invalidate previous active verification OTPs
      await client.query(
        `
        UPDATE auth_otp_challenges
        SET consumed_at = NOW()
        WHERE
          user_id = $1
          AND purpose = 'EMAIL_VERIFICATION'
          AND consumed_at IS NULL
        `,
        [existing.id],
      );

      // Create new verification challenge
      await client.query(
        `
        INSERT INTO auth_otp_challenges (
          user_id,
          purpose,
          otp_hash,
          expires_at,
          attempts,
          max_attempts,
          last_sent_at
        )
        VALUES (
          $1,
          'EMAIL_VERIFICATION',
          $2,
          NOW() + INTERVAL '10 minutes',
          0,
          5,
          NOW()
        )
        `,
        [existing.id, otpHash],
      );

      await client.query("COMMIT");

      // Send email after successful DB commit
      await verifyEmailTemplate(
        existing.email,
        otp,
      )


      return {
        id: existing.id,
        organizationId: existing.organization_id,
        fullName: existing.fullname,
        email: existing.email,
        roleId: existing.role_id,
        requiresVerification: true,
      };
    }

    /*
     * --------------------------------------------------
     * New registration
     * --------------------------------------------------
     */

    const hashedPassword = await bcryptjs.hash(
      userData.password,
      BCRYPT_SALT_ROUNDS
        ? parseInt(BCRYPT_SALT_ROUNDS)
        : 10,
    );

    // 1. Create Organization
    const organizationResult =
      await client.query(
        `
        INSERT INTO organizations (name)
        VALUES ($1)
        RETURNING id
        `,
        [userData.organizationName],
      );

    const organizationId =
      organizationResult.rows[0].id;

    // 2. Create Admin Role
    const adminRoleResult =
      await client.query(
        `
        INSERT INTO roles (
          organization_id,
          name,
          description
        )
        VALUES ($1, $2, $3)
        RETURNING id
        `,
        [
          organizationId,
          "admin",
          `admin of organization '${userData.organizationName}'`,
        ],
      );

    const roleId =
      adminRoleResult.rows[0].id;

    // 3. Create Admin User
    const userResult = await client.query(
      `
      INSERT INTO users (
        organization_id,
        fullName,
        email,
        password,
        role_id,
        email_verified
      )
      VALUES ($1, $2, $3, $4, $5, FALSE)
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
      ],
    );

    const user = userResult.rows[0];

    // 4. Give all permissions to admin
    await client.query(
      `
      INSERT INTO role_permissions (
        role_id,
        permission_id
      )
      SELECT r.id, p.id
      FROM roles r
      CROSS JOIN permissions p
      WHERE r.id = $1
      `,
      [roleId],
    );

    // 5. Generate registration OTP
    const otp = generateOtp();
    const otpHash = hashOtp(otp);

    // 6. Create OTP challenge
    await client.query(
      `
      INSERT INTO auth_otp_challenges (
        user_id,
        purpose,
        otp_hash,
        expires_at,
        attempts,
        max_attempts,
        last_sent_at
      )
      VALUES (
        $1,
        'EMAIL_VERIFICATION',
        $2,
        NOW() + INTERVAL '10 minutes',
        0,
        5,
        NOW()
      )
      `,
      [user.id, otpHash],
    );

    // 7. Commit database transaction
    await client.query("COMMIT");

    // 8. Send email after commit
    await verifyEmailTemplate(
      user.email,
      otp,
    )

    return {
      id: user.id,
      organizationId: user.organization_id,
      fullName: user.fullname,
      email: user.email,
      roleId: user.role_id,
      requiresVerification: true,
    };
  } catch (error) {
    /*
     * Don't try to rollback an already committed
     * transaction.
     */
    try {
      await client.query("ROLLBACK");
    } catch {
      // Transaction may already be committed.
    }

    console.error(
      "Error in register function:",
      error,
    );

    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(
      "Failed to register user",
      500,
    );
  } finally {
    client.release();
  }
};


// login function to authenticate user and return user details

export const login = async (
  email: string,
  password: string,
) => {
  try {
    const result = await pool.query(
      `
      SELECT
        u.id,
        u.fullname,
        u.email,
        r.name AS role,
        u.organization_id,
        u.password,
        u.email_verified
      FROM users u
      JOIN roles r
        ON u.role_id = r.id
      WHERE u.email = $1
        AND u.is_active = TRUE
      `,
      [email],
    );

    const user = result.rows[0];

    if (!user) {
      throw new AppError(
        "Invalid credentials",
        401,
      );
    }

    if (!user.email_verified && !isDemoAccount(user.email)) {
      throw new AppError(
        "Please verify your email before logging in",
        403,
      );
    }

    const isMatch = await bcryptjs.compare(
      password,
      user.password,
    );

    if (!isMatch) {
      throw new AppError(
        "Invalid credentials",
        401,
      );
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        organizationId: user.organization_id,
      },
      JWT_SECRET,
      {
        expiresIn: JWT_EXPIRES_IN,
      },
    );

    return {
      id: user.id,
      fullName: user.fullname,
      email: user.email,
      role: user.role,
      token,
    };
  } catch (error) {
    console.error("Error in login:", error);

    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(
      "Failed to login user",
      500,
    );
  }
};


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
    isDemo: isDemoAccount(user.email),
    permissions,
  };
};


export const getInvitationDetails = async (
  invitationToken: string,
) => {
  const tokenHash = crypto
    .createHash("sha256")
    .update(invitationToken)
    .digest("hex");

  const result = await pool.query(
    `
    SELECT
      ui.email,
      ui.full_name,
      ui.phone,
      ui.expires_at,
      r.name AS role,
      rt.fullname AS reports_to,
      o.name AS organization
    FROM user_invitations ui
    JOIN roles r
      ON ui.role_id = r.id
    JOIN organizations o
      ON ui.organization_id = o.id
    LEFT JOIN users rt
      ON ui.reports_to = rt.id
    WHERE ui.token_hash = $1
      AND ui.used_at IS NULL
    `,
    [tokenHash],
  );

  if (result.rows.length === 0) {
    throw new AppError(
      "Invalid or expired invitation",
      400,
    );
  }

  const invitation = result.rows[0];

  if (
    new Date(invitation.expires_at) <=
    new Date()
  ) {
    throw new AppError(
      "This invitation has expired",
      400,
    );
  }

  return {
    fullName: invitation.full_name,
    email: invitation.email,
    phone: invitation.phone,
    role: invitation.role,
    reportsTo: invitation.reports_to,
    organization: invitation.organization,
    expiresAt: invitation.expires_at,
  };
};


export const acceptInvitation = async (
  invitationToken: string,
  password: string,
) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    if (!invitationToken) {
      throw new AppError(
        "Invitation token is required",
        400,
      );
    }

    if (!password) {
      throw new AppError(
        "Password is required",
        400,
      );
    }

    // 1. Hash invitation token
    const tokenHash = crypto
      .createHash("sha256")
      .update(invitationToken)
      .digest("hex");

    // 2. Find and lock invitation
    const invitationResult =
      await client.query(
        `
        SELECT
          ui.id,
          ui.organization_id,
          ui.email,
          ui.full_name,
          ui.phone,
          ui.role_id,
          ui.reports_to,
          ui.expires_at,
          ui.used_at,
          r.name AS role
        FROM user_invitations ui
        JOIN roles r
          ON r.id = ui.role_id
        WHERE ui.token_hash = $1
        FOR UPDATE
        `,
        [tokenHash],
      );

    if (invitationResult.rows.length === 0) {
      throw new AppError(
        "Invalid invitation",
        400,
      );
    }

    const invitation =
      invitationResult.rows[0];

    // 3. Check if already used
    if (invitation.used_at) {
      throw new AppError(
        "This invitation has already been used",
        400,
      );
    }

    // 4. Check expiration
    if (
      new Date(invitation.expires_at) <=
      new Date()
    ) {
      throw new AppError(
        "This invitation has expired",
        400,
      );
    }

    // 5. Check whether email has already
    // been registered
    const existingUser = await client.query(
      `
      SELECT id
      FROM users
      WHERE email = $1
      `,
      [invitation.email],
    );

    if (existingUser.rows.length > 0) {
      throw new AppError(
        "An account already exists for this email",
        409,
      );
    }

    // 6. Hash password
    const hashedPassword =
      await bcryptjs.hash(
        password,
        BCRYPT_SALT_ROUNDS
          ? parseInt(BCRYPT_SALT_ROUNDS)
          : 10,
      );

    // 7. Create actual user
    const userResult = await client.query(
      `
      INSERT INTO users (
        organization_id,
        fullName,
        email,
        password,
        phone,
        role_id,
        reports_to,
        email_verified,
        is_active
      )
      VALUES (
        $1,
        $2,
        $3,
        $4,
        $5,
        $6,
        $7,
        TRUE,
        TRUE
      )
      RETURNING
        id,
        organization_id,
        fullName,
        email,
        role_id
      `,
      [
        invitation.organization_id,
        invitation.full_name,
        invitation.email,
        hashedPassword,
        invitation.phone,
        invitation.role_id,
        invitation.reports_to,
      ],
    );

    const user = userResult.rows[0];

    // 8. Consume invitation
    await client.query(
      `
      UPDATE user_invitations
      SET used_at = NOW()
      WHERE id = $1
      `,
      [invitation.id],
    );

    // 9. Commit
    await client.query("COMMIT");

    // 10. Create JWT using the role
    // we already fetched above
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: invitation.role,
        organizationId:
          user.organization_id,
      },
      JWT_SECRET,
      {
        expiresIn: JWT_EXPIRES_IN,
      },
    );

    return {
      token,
      user: {
        id: user.id,
        organizationId:
          user.organization_id,
        fullName: user.fullname,
        email: user.email,
        role: invitation.role,
      },
    };
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch {
      // Transaction may already be committed.
    }

    if (error instanceof AppError) {
      throw error;
    }

    console.error(
      "Error accepting invitation:",
      error,
    );

    throw new AppError(
      "Failed to accept invitation",
      500,
    );
  } finally {
    client.release();
  }
};

export const forgotPassword = async (
  email: string,
) => {
  const client = await pool.connect();

  try {
    if (isDemoAccount(email)) {
      throw new AppError(
        "Action disabled: Password reset is not permitted for demo accounts.",
        403,
      );
    }

    await client.query("BEGIN");

    const result = await client.query(
      `
      SELECT id, email, is_active
      FROM users
      WHERE email = $1
      `,
      [email],
    );

    if (result.rows.length === 0) {
      await client.query("COMMIT");
      return;
    }

    const user = result.rows[0];

    if (!user.is_active) {
      await client.query("COMMIT");
      return;
    }

    await client.query(
      `
      UPDATE auth_otp_challenges
      SET consumed_at = NOW()
      WHERE
        user_id = $1
        AND purpose = 'PASSWORD_RESET'
        AND consumed_at IS NULL
      `,
      [user.id],
    );

    const otp = generateOtp();
    const otpHash = hashOtp(otp);

    await client.query(
      `
      INSERT INTO auth_otp_challenges (
        user_id,
        purpose,
        otp_hash,
        expires_at,
        attempts,
        max_attempts,
        last_sent_at
      )
      VALUES (
        $1,
        'PASSWORD_RESET',
        $2,
        NOW() + INTERVAL '10 minutes',
        0,
        5,
        NOW()
      )
      `,
      [user.id, otpHash],
    );

    await client.query("COMMIT");

    await sendPasswordResetEmail(
      user.email,
      otp,
    );
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch { }

    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(
      "Failed to process password reset request",
      500,
    );
  } finally {
    client.release();
  }
};


export const resetPassword = async (
  email: string,
  otp: string,
  newPassword: string,
) => {
  const client = await pool.connect();

  try {
    if (isDemoAccount(email)) {
      throw new AppError(
        "Action disabled: Password reset is not permitted for demo accounts.",
        403,
      );
    }

    await client.query("BEGIN");

    // 1. Find user
    const userResult = await client.query(
      `
      SELECT
        id,
        email,
        is_active
      FROM users
      WHERE email = $1
      `,
      [email],
    );

    if (userResult.rows.length === 0) {
      throw new AppError(
        "Invalid verification request",
        400,
      );
    }

    const user = userResult.rows[0];

    if (!user.is_active) {
      throw new AppError(
        "Account is inactive",
        403,
      );
    }

    // 2. Find latest active password reset OTP
    const challengeResult =
      await client.query(
        `
        SELECT
          id,
          otp_hash,
          expires_at,
          attempts,
          max_attempts
        FROM auth_otp_challenges
        WHERE
          user_id = $1
          AND purpose = 'PASSWORD_RESET'
          AND consumed_at IS NULL
        ORDER BY created_at DESC
        LIMIT 1
        `,
        [user.id],
      );

    if (
      challengeResult.rows.length === 0
    ) {
      throw new AppError(
        "Invalid or expired verification code",
        400,
      );
    }

    const challenge =
      challengeResult.rows[0];

    // 3. Check expiry
    if (
      new Date(challenge.expires_at) <=
      new Date()
    ) {
      throw new AppError(
        "Verification code has expired",
        400,
      );
    }

    // 4. Check attempts
    if (
      challenge.attempts >=
      challenge.max_attempts
    ) {
      throw new AppError(
        "Too many attempts. Please request a new code.",
        429,
      );
    }

    // 5. Verify OTP
    const submittedOtpHash =
      hashOtp(otp);

    if (
      submittedOtpHash !==
      challenge.otp_hash
    ) {
      await client.query(
        `
        UPDATE auth_otp_challenges
        SET attempts = attempts + 1
        WHERE id = $1
        `,
        [challenge.id],
      );

      await client.query("COMMIT");

      throw new AppError(
        "Invalid verification code",
        400,
      );
    }

    // 6. Hash new password
    const hashedPassword =
      await bcryptjs.hash(
        newPassword,
        BCRYPT_SALT_ROUNDS
          ? parseInt(BCRYPT_SALT_ROUNDS)
          : 10,
      );

    // 7. Update password
    await client.query(
      `
      UPDATE users
      SET
        password = $1,
        updated_at = NOW()
      WHERE
        id = $2
        AND is_active = TRUE
      `,
      [hashedPassword, user.id],
    );

    // 8. Consume OTP
    await client.query(
      `
      UPDATE auth_otp_challenges
      SET consumed_at = NOW()
      WHERE id = $1
      `,
      [challenge.id],
    );

    await client.query("COMMIT");
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch { }

    if (error instanceof AppError) {
      throw error;
    }

    console.error(
      "Error resetting password:",
      error,
    );

    throw new AppError(
      "Failed to reset password",
      500,
    );
  } finally {
    client.release();
  }
};


export const changePassword = async (
  userId: number,
  currentPassword: string,
  newPassword: string,
) => {
  const result = await pool.query(
    `
    SELECT id, email, password
    FROM users
    WHERE id = $1
      AND is_active = TRUE
    `,
    [userId],
  );

  if (result.rows.length === 0) {
    throw new AppError(
      "User not found",
      404,
    );
  }

  const user = result.rows[0];

  if (isDemoAccount(user.email)) {
    throw new AppError(
      "Action disabled: Demo account password cannot be modified to preserve portfolio demo access.",
      403,
    );
  }

  const isMatch = await bcryptjs.compare(
    currentPassword,
    user.password,
  );

  if (!isMatch) {
    throw new AppError(
      "Current password is incorrect",
      400,
    );
  }

  const hashedPassword =
    await bcryptjs.hash(
      newPassword,
      BCRYPT_SALT_ROUNDS
        ? parseInt(BCRYPT_SALT_ROUNDS)
        : 10,
    );

  await pool.query(
    `
    UPDATE users
    SET
      password = $1,
      updated_at = NOW()
    WHERE id = $2
    `,
    [hashedPassword, userId],
  );
};


export const sendLoginOtp = async (email: string) => {
  if (!email || !email.trim()) {
    throw new AppError("Email is required", 400);
  }

  const normalizedEmail = email.trim().toLowerCase();

  const userResult = await pool.query(
    `
    SELECT
      id,
      fullname,
      email,
      is_active,
      email_verified
    FROM users
    WHERE email = $1
    `,
    [normalizedEmail],
  );

  if (userResult.rows.length === 0) {
    throw new AppError(
      "No account found with this email address. Please register first.",
      404,
    );
  }

  const user = userResult.rows[0];

  if (!user.is_active) {
    throw new AppError("Account is inactive. Please contact support.", 403);
  }

  // Rate limit: check if a code was sent in the last 60 seconds
  const recentChallenge = await pool.query(
    `
    SELECT id, last_sent_at
    FROM auth_otp_challenges
    WHERE user_id = $1
      AND purpose = 'LOGIN_OTP'
      AND last_sent_at > NOW() - INTERVAL '60 seconds'
    ORDER BY created_at DESC
    LIMIT 1
    `,
    [user.id],
  );

  if (recentChallenge.rows.length > 0) {
    throw new AppError(
      "A code was recently sent. Please wait 60 seconds before requesting a new one.",
      429,
    );
  }

  // Invalidate previous unconsumed LOGIN_OTP challenges
  await pool.query(
    `
    UPDATE auth_otp_challenges
    SET consumed_at = NOW()
    WHERE user_id = $1
      AND purpose = 'LOGIN_OTP'
      AND consumed_at IS NULL
    `,
    [user.id],
  );

  const otp = generateOtp();
  const otpHash = hashOtp(otp);

  await pool.query(
    `
    INSERT INTO auth_otp_challenges (
      user_id,
      purpose,
      otp_hash,
      expires_at,
      attempts,
      max_attempts,
      last_sent_at
    )
    VALUES ($1, 'LOGIN_OTP', $2, NOW() + INTERVAL '10 minutes', 0, 5, NOW())
    `,
    [user.id, otpHash],
  );

  console.log(`\x1b[36m[DEV OTP] Login code for ${normalizedEmail} is: ${otp}\x1b[0m`);

  try {
    await sendLoginOtpEmail(normalizedEmail, otp);
  } catch (err) {
    console.error("Failed to send login OTP email via Brevo:", err);
  }

  return {
    success: true,
    message: "A 6-digit login verification code has been sent to your email.",
  };
};

export const verifyLoginOtp = async (email: string, otp: string) => {
  if (!email || !otp) {
    throw new AppError("Email and verification code are required", 400);
  }

  const normalizedEmail = email.trim().toLowerCase();
  const cleanOtp = otp.trim();

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const userResult = await client.query(
      `
      SELECT
        u.id,
        u.fullname,
        u.email,
        u.organization_id,
        u.email_verified,
        u.is_active,
        r.name AS role
      FROM users u
      JOIN roles r
        ON u.role_id = r.id
      WHERE u.email = $1
      `,
      [normalizedEmail],
    );

    if (userResult.rows.length === 0) {
      throw new AppError("Invalid login verification request", 400);
    }

    const user = userResult.rows[0];

    if (!user.is_active) {
      throw new AppError("Account is inactive", 403);
    }

    const challengeResult = await client.query(
      `
      SELECT
        id,
        otp_hash,
        expires_at,
        attempts,
        max_attempts
      FROM auth_otp_challenges
      WHERE
        user_id = $1
        AND purpose = 'LOGIN_OTP'
        AND consumed_at IS NULL
      ORDER BY created_at DESC
      LIMIT 1
      `,
      [user.id],
    );

    if (challengeResult.rows.length === 0) {
      throw new AppError(
        "Invalid or expired verification code. Please request a new code.",
        400,
      );
    }

    const challenge = challengeResult.rows[0];

    if (new Date(challenge.expires_at) <= new Date()) {
      throw new AppError(
        "Verification code has expired. Please request a new one.",
        400,
      );
    }

    if (challenge.attempts >= challenge.max_attempts) {
      throw new AppError(
        "Too many invalid attempts. Please request a new code.",
        429,
      );
    }

    const submittedOtpHash = hashOtp(cleanOtp);

    if (submittedOtpHash !== challenge.otp_hash) {
      await client.query(
        `
        UPDATE auth_otp_challenges
        SET attempts = attempts + 1
        WHERE id = $1
        `,
        [challenge.id],
      );

      await client.query("COMMIT");

      throw new AppError("Invalid verification code", 400);
    }

    // Mark challenge consumed
    await client.query(
      `
      UPDATE auth_otp_challenges
      SET consumed_at = NOW()
      WHERE id = $1
      `,
      [challenge.id],
    );

    // If email wasn't verified yet, verify it now
    if (!user.email_verified) {
      await client.query(
        `
        UPDATE users
        SET email_verified = TRUE, updated_at = NOW()
        WHERE id = $1
        `,
        [user.id],
      );
    }

    await client.query("COMMIT");

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        organizationId: user.organization_id,
      },
      JWT_SECRET,
      {
        expiresIn: JWT_EXPIRES_IN,
      },
    );

    return {
      token,
      user: {
        id: user.id,
        fullName: user.fullname,
        email: user.email,
        role: user.role,
        organizationId: user.organization_id,
      },
    };
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch {
      // Transaction may already be committed.
    }

    if (error instanceof AppError) {
      throw error;
    }

    console.error("Error in verifyLoginOtp:", error);
    throw new AppError("Failed to verify login", 500);
  } finally {
    client.release();
  }
};

export const handleGoogleOAuth = async (code: string) => {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    throw new AppError(
      "Google OAuth is not configured on the server. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in backend/.env",
      500,
    );
  }

  // 1. Exchange authorization code for tokens
  const tokenParams = new URLSearchParams({
    code,
    client_id: GOOGLE_CLIENT_ID,
    client_secret: GOOGLE_CLIENT_SECRET,
    redirect_uri: GOOGLE_CALLBACK_URL,
    grant_type: "authorization_code",
  });

  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: tokenParams.toString(),
  });

  const tokenData = (await tokenResponse.json()) as any;

  if (!tokenResponse.ok || !tokenData.access_token) {
    console.error("Google token exchange failed:", tokenData);
    throw new AppError(
      tokenData.error_description || "Failed to authenticate with Google",
      400,
    );
  }

  // 2. Fetch Google profile
  const userinfoResponse = await fetch(
    "https://www.googleapis.com/oauth2/v2/userinfo",
    {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    },
  );

  const profile = (await userinfoResponse.json()) as any;

  if (!userinfoResponse.ok || !profile.email) {
    console.error("Google userinfo fetch failed:", profile);
    throw new AppError("Failed to retrieve profile from Google", 400);
  }

  const email = profile.email.toLowerCase().trim();
  const googleId = profile.id;
  const fullName = profile.name || email.split("@")[0];

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 3. Find if user exists by email
    const existingUserRes = await client.query(
      `
      SELECT
        u.id,
        u.fullname,
        u.email,
        u.organization_id,
        u.role_id,
        u.is_active,
        u.oauth_provider,
        u.oauth_id,
        r.name AS role
      FROM users u
      JOIN roles r
        ON u.role_id = r.id
      WHERE u.email = $1
      `,
      [email],
    );

    let user: any;

    if (existingUserRes.rows.length > 0) {
      user = existingUserRes.rows[0];

      if (!user.is_active) {
        throw new AppError("Account is inactive. Please contact support.", 403);
      }

      // Link Google OAuth if not linked yet
      if (user.oauth_provider !== "google" || user.oauth_id !== googleId) {
        await client.query(
          `
          UPDATE users
          SET
            oauth_provider = 'google',
            oauth_id = $1,
            email_verified = TRUE,
            updated_at = NOW()
          WHERE id = $2
          `,
          [googleId, user.id],
        );
      }
    } else {
      // 4. Register new user via Google
      const orgName = `${fullName}'s Workspace`;

      // Create Organization
      const orgRes = await client.query(
        `
        INSERT INTO organizations (name)
        VALUES ($1)
        RETURNING id
        `,
        [orgName],
      );
      const organizationId = orgRes.rows[0].id;

      // Create Admin Role
      const roleRes = await client.query(
        `
        INSERT INTO roles (organization_id, name, description)
        VALUES ($1, 'admin', $2)
        RETURNING id
        `,
        [organizationId, `admin of organization '${orgName}'`],
      );
      const roleId = roleRes.rows[0].id;

      // Grant all permissions to admin
      await client.query(
        `
        INSERT INTO role_permissions (role_id, permission_id)
        SELECT $1, p.id
        FROM permissions p
        `,
        [roleId],
      );

      // Generate a strong random password meeting password complexity constraint
      const randomPassword = "GAuth_" + crypto.randomBytes(16).toString("hex") + "9A!";
      const hashedPassword = await bcryptjs.hash(
        randomPassword,
        BCRYPT_SALT_ROUNDS ? parseInt(BCRYPT_SALT_ROUNDS) : 10,
      );

      // Create User
      const newUserRes = await client.query(
        `
        INSERT INTO users (
          organization_id,
          fullname,
          email,
          password,
          role_id,
          email_verified,
          oauth_provider,
          oauth_id
        )
        VALUES ($1, $2, $3, $4, $5, TRUE, 'google', $6)
        RETURNING id, fullname, email, organization_id, role_id
        `,
        [organizationId, fullName, email, hashedPassword, roleId, googleId],
      );

      user = {
        ...newUserRes.rows[0],
        role: "admin",
      };
    }

    await client.query("COMMIT");

    // 5. Generate JWT token
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        organizationId: user.organization_id,
      },
      JWT_SECRET,
      {
        expiresIn: JWT_EXPIRES_IN,
      },
    );

    return {
      token,
      user: {
        id: user.id,
        fullName: user.fullname,
        email: user.email,
        role: user.role,
        organizationId: user.organization_id,
      },
    };
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch {
      // Transaction may already be committed.
    }

    if (error instanceof AppError) {
      throw error;
    }

    console.error("Error in handleGoogleOAuth:", error);
    throw new AppError("Failed to complete Google authentication", 500);
  } finally {
    client.release();
  }
};
