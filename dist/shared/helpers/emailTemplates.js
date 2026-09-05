"use strict";
// src/shared/helpers/sendVerificationEmail.helper.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendPasswordResetEmail = exports.sendInvitationEmail = void 0;
exports.verifyEmailTemplate = verifyEmailTemplate;
const sendEmail_helper_1 = require("./sendEmail.helper");
async function verifyEmailTemplate(to, otp) {
    await (0, sendEmail_helper_1.sendEmail)({
        to,
        subject: "Verify your email | CRM Platform",
        html: `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta
            name="viewport"
            content="width=device-width, initial-scale=1.0"
          />
          <title>Verify your email</title>
        </head>

        <body
          style="
            margin: 0;
            padding: 0;
            background-color: #f4f4f5;
            font-family: Arial, Helvetica, sans-serif;
            color: #18181b;
          "
        >
          <table
            width="100%"
            cellpadding="0"
            cellspacing="0"
            border="0"
            style="background-color: #f4f4f5; padding: 40px 16px;"
          >
            <tr>
              <td align="center">

                <table
                  width="100%"
                  cellpadding="0"
                  cellspacing="0"
                  border="0"
                  style="
                    max-width: 520px;
                    background-color: #ffffff;
                    border: 1px solid #e4e4e7;
                    border-radius: 16px;
                    overflow: hidden;
                  "
                >

                  <!-- Header -->
                  <tr>
                    <td
                      style="
                        padding: 28px 32px;
                        border-bottom: 1px solid #e4e4e7;
                      "
                    >
                      <table
                        width="100%"
                        cellpadding="0"
                        cellspacing="0"
                        border="0"
                      >
                        <tr>
                          <td>
                            <div
                              style="
                                display: inline-block;
                                width: 36px;
                                height: 36px;
                                line-height: 36px;
                                text-align: center;
                                background-color: #18181b;
                                color: #ffffff;
                                border-radius: 10px;
                                font-size: 18px;
                                font-weight: bold;
                              "
                            >
                              C
                            </div>
                          </td>

                          <td
                            style="
                              padding-left: 10px;
                              font-size: 17px;
                              font-weight: 600;
                              color: #18181b;
                            "
                          >
                            CRM Platform
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                  <!-- Content -->
                  <tr>
                    <td
                      style="
                        padding: 40px 32px;
                      "
                    >
                      <h1
                        style="
                          margin: 0 0 12px;
                          font-size: 26px;
                          line-height: 1.3;
                          color: #18181b;
                        "
                      >
                        Verify your email
                      </h1>

                      <p
                        style="
                          margin: 0 0 28px;
                          font-size: 15px;
                          line-height: 1.7;
                          color: #52525b;
                        "
                      >
                        Thanks for signing up for CRM Platform.
                        Enter the verification code below to
                        confirm your email address.
                      </p>

                      <!-- OTP -->
                      <table
                        width="100%"
                        cellpadding="0"
                        cellspacing="0"
                        border="0"
                      >
                        <tr>
                          <td align="center">
                            <div
                              style="
                                display: inline-block;
                                padding: 18px 28px;
                                background-color: #f4f4f5;
                                border: 1px solid #e4e4e7;
                                border-radius: 12px;
                                font-size: 32px;
                                line-height: 1;
                                font-weight: 700;
                                letter-spacing: 8px;
                                color: #18181b;
                              "
                            >
                              ${otp}
                            </div>
                          </td>
                        </tr>
                      </table>

                      <p
                        style="
                          margin: 24px 0 0;
                          font-size: 14px;
                          line-height: 1.6;
                          color: #71717a;
                          text-align: center;
                        "
                      >
                        This code expires in
                        <strong style="color: #18181b;">
                          10 minutes
                        </strong>.
                      </p>

                      <div
                        style="
                          margin-top: 32px;
                          padding: 14px 16px;
                          background-color: #fafafa;
                          border-left: 3px solid #18181b;
                        "
                      >
                        <p
                          style="
                            margin: 0;
                            font-size: 13px;
                            line-height: 1.6;
                            color: #52525b;
                          "
                        >
                          If you didn't request this code,
                          you can safely ignore this email.
                        </p>
                      </div>
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td
                      style="
                        padding: 20px 32px;
                        background-color: #fafafa;
                        border-top: 1px solid #e4e4e7;
                      "
                    >
                      <p
                        style="
                          margin: 0;
                          font-size: 12px;
                          line-height: 1.6;
                          color: #a1a1aa;
                          text-align: center;
                        "
                      >
                        © ${new Date().getFullYear()}
                        CRM Platform. All rights reserved.
                      </p>
                    </td>
                  </tr>

                </table>

              </td>
            </tr>
          </table>
        </body>
      </html>
    `,
    });
}
;
const sendInvitationEmail = async (to, invitationUrl) => {
    await (0, sendEmail_helper_1.sendEmail)({
        to,
        subject: "You're invited to CRM Platform",
        html: `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />

          <meta
            name="viewport"
            content="width=device-width, initial-scale=1.0"
          />

          <title>You're invited to CRM Platform</title>
        </head>

        <body
          style="
            margin: 0;
            padding: 0;
            background-color: #f4f4f5;
            font-family: Arial, Helvetica, sans-serif;
            color: #18181b;
          "
        >
          <table
            width="100%"
            cellpadding="0"
            cellspacing="0"
            border="0"
            style="
              background-color: #f4f4f5;
              padding: 40px 16px;
            "
          >
            <tr>
              <td align="center">

                <table
                  width="100%"
                  cellpadding="0"
                  cellspacing="0"
                  border="0"
                  style="
                    max-width: 520px;
                    background-color: #ffffff;
                    border: 1px solid #e4e4e7;
                    border-radius: 16px;
                    overflow: hidden;
                  "
                >

                  <!-- Header -->
                  <tr>
                    <td
                      style="
                        padding: 28px 32px;
                        border-bottom: 1px solid #e4e4e7;
                      "
                    >
                      <table
                        width="100%"
                        cellpadding="0"
                        cellspacing="0"
                        border="0"
                      >
                        <tr>
                          <td>
                            <div
                              style="
                                display: inline-block;
                                width: 36px;
                                height: 36px;
                                line-height: 36px;
                                text-align: center;
                                background-color: #18181b;
                                color: #ffffff;
                                border-radius: 10px;
                                font-size: 18px;
                                font-weight: 700;
                              "
                            >
                              C
                            </div>
                          </td>

                          <td
                            style="
                              padding-left: 10px;
                              font-size: 17px;
                              font-weight: 600;
                              color: #18181b;
                            "
                          >
                            CRM Platform
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                  <!-- Content -->
                  <tr>
                    <td style="padding: 40px 32px;">
                      <h1
                        style="
                          margin: 0 0 12px;
                          font-size: 26px;
                          line-height: 1.3;
                          color: #18181b;
                        "
                      >
                        You're invited
                      </h1>

                      <p
                        style="
                          margin: 0 0 18px;
                          font-size: 15px;
                          line-height: 1.7;
                          color: #52525b;
                        "
                      >
                        You've been invited to join your
                        organization's CRM workspace.
                      </p>

                      <p
                        style="
                          margin: 0 0 28px;
                          font-size: 15px;
                          line-height: 1.7;
                          color: #52525b;
                        "
                      >
                        Complete your account setup by
                        clicking the button below.
                      </p>

                      <!-- CTA -->
                      <table
                        width="100%"
                        cellpadding="0"
                        cellspacing="0"
                        border="0"
                      >
                        <tr>
                          <td align="center">
                            <a
                              href="${invitationUrl}"
                              style="
                                display: inline-block;
                                padding: 13px 24px;
                                background-color: #18181b;
                                color: #ffffff;
                                text-decoration: none;
                                font-size: 14px;
                                font-weight: 600;
                                border-radius: 8px;
                              "
                            >
                              Complete Account Setup
                            </a>
                          </td>
                        </tr>
                      </table>

                      <!-- Expiry -->
                      <div
                        style="
                          margin-top: 28px;
                          padding: 14px 16px;
                          background-color: #fafafa;
                          border-left: 3px solid #18181b;
                        "
                      >
                        <p
                          style="
                            margin: 0;
                            font-size: 13px;
                            line-height: 1.6;
                            color: #52525b;
                          "
                        >
                          This invitation expires in
                          <strong style="color: #18181b;">
                            24 hours
                          </strong>.
                        </p>
                      </div>

                      <!-- Security notice -->
                      <p
                        style="
                          margin: 24px 0 0;
                          font-size: 12px;
                          line-height: 1.6;
                          color: #a1a1aa;
                        "
                      >
                        If you weren't expecting this invitation,
                        you can safely ignore this email.
                      </p>

                      <!-- Fallback URL -->
                      <p
                        style="
                          margin: 24px 0 0;
                          font-size: 12px;
                          line-height: 1.6;
                          color: #a1a1aa;
                          word-break: break-all;
                        "
                      >
                        If the button doesn't work, copy and paste
                        this link into your browser:
                        <br />
                        <span style="color: #71717a;">
                          ${invitationUrl}
                        </span>
                      </p>
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td
                      style="
                        padding: 20px 32px;
                        background-color: #fafafa;
                        border-top: 1px solid #e4e4e7;
                      "
                    >
                      <p
                        style="
                          margin: 0;
                          font-size: 12px;
                          line-height: 1.6;
                          color: #a1a1aa;
                          text-align: center;
                        "
                      >
                        © ${new Date().getFullYear()}
                        CRM Platform. All rights reserved.
                      </p>
                    </td>
                  </tr>

                </table>

              </td>
            </tr>
          </table>
        </body>
      </html>
    `,
    });
};
exports.sendInvitationEmail = sendInvitationEmail;
const sendPasswordResetEmail = async (to, otp) => {
    await (0, sendEmail_helper_1.sendEmail)({
        to,
        subject: "Reset your CRM password",
        html: `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta
            name="viewport"
            content="width=device-width, initial-scale=1.0"
          />
          <title>Reset your password</title>
        </head>

        <body
          style="
            margin: 0;
            padding: 40px 16px;
            background-color: #f4f4f5;
            font-family: Arial, Helvetica, sans-serif;
            color: #18181b;
          "
        >
          <table
            width="100%"
            cellpadding="0"
            cellspacing="0"
            border="0"
            style="
              background-color: #f4f4f5;
              padding: 40px 16px;
            "
          >
            <tr>
              <td align="center">

                <table
                  width="100%"
                  cellpadding="0"
                  cellspacing="0"
                  border="0"
                  style="
                    max-width: 520px;
                    background-color: #ffffff;
                    border: 1px solid #e4e4e7;
                    border-radius: 16px;
                    overflow: hidden;
                  "
                >

                  <!-- Header -->
                  <tr>
                    <td
                      style="
                        padding: 28px 32px;
                        border-bottom: 1px solid #e4e4e7;
                      "
                    >
                      <div
                        style="
                          display: inline-block;
                          width: 36px;
                          height: 36px;
                          line-height: 36px;
                          text-align: center;
                          background-color: #18181b;
                          color: #ffffff;
                          border-radius: 10px;
                          font-size: 18px;
                          font-weight: 700;
                        "
                      >
                        C
                      </div>

                      <span
                        style="
                          margin-left: 10px;
                          font-size: 17px;
                          font-weight: 600;
                          color: #18181b;
                          vertical-align: top;
                          line-height: 36px;
                        "
                      >
                        CRM Platform
                      </span>
                    </td>
                  </tr>

                  <!-- Content -->
                  <tr>
                    <td style="padding: 40px 32px;">
                      <h1
                        style="
                          margin: 0 0 12px;
                          font-size: 26px;
                          line-height: 1.3;
                          color: #18181b;
                        "
                      >
                        Reset your password
                      </h1>

                      <p
                        style="
                          margin: 0 0 28px;
                          font-size: 15px;
                          line-height: 1.7;
                          color: #52525b;
                        "
                      >
                        We received a request to reset your
                        CRM Platform password. Use the
                        verification code below to continue.
                      </p>

                      <!-- OTP -->
                      <table
                        width="100%"
                        cellpadding="0"
                        cellspacing="0"
                        border="0"
                      >
                        <tr>
                          <td align="center">
                            <div
                              style="
                                display: inline-block;
                                padding: 18px 28px;
                                background-color: #f4f4f5;
                                border: 1px solid #e4e4e7;
                                border-radius: 12px;
                                font-size: 32px;
                                line-height: 1;
                                font-weight: 700;
                                letter-spacing: 8px;
                                color: #18181b;
                              "
                            >
                              ${otp}
                            </div>
                          </td>
                        </tr>
                      </table>

                      <p
                        style="
                          margin: 24px 0 0;
                          font-size: 14px;
                          line-height: 1.6;
                          color: #71717a;
                          text-align: center;
                        "
                      >
                        This code expires in
                        <strong style="color: #18181b;">
                          10 minutes
                        </strong>.
                      </p>

                      <!-- Security notice -->
                      <div
                        style="
                          margin-top: 32px;
                          padding: 14px 16px;
                          background-color: #fafafa;
                          border-left: 3px solid #18181b;
                        "
                      >
                        <p
                          style="
                            margin: 0;
                            font-size: 13px;
                            line-height: 1.6;
                            color: #52525b;
                          "
                        >
                          If you didn't request a password reset,
                          you can safely ignore this email.
                        </p>
                      </div>
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td
                      style="
                        padding: 20px 32px;
                        background-color: #fafafa;
                        border-top: 1px solid #e4e4e7;
                      "
                    >
                      <p
                        style="
                          margin: 0;
                          font-size: 12px;
                          line-height: 1.6;
                          color: #a1a1aa;
                          text-align: center;
                        "
                      >
                        © ${new Date().getFullYear()}
                        CRM Platform. All rights reserved.
                      </p>
                    </td>
                  </tr>

                </table>

              </td>
            </tr>
          </table>
        </body>
      </html>
    `,
    });
};
exports.sendPasswordResetEmail = sendPasswordResetEmail;
