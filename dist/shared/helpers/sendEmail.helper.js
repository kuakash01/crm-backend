"use strict";
// src/shared/helpers/sendEmail.helper.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEmail = void 0;
const brevo_1 = require("@getbrevo/brevo");
const env_1 = require("../../config/env");
const brevo = new brevo_1.BrevoClient({
    apiKey: env_1.BREVO_API_KEY,
});
const sendEmail = async ({ to, subject, html, }) => {
    try {
        const result = await brevo.transactionalEmails.sendTransacEmail({
            sender: {
                email: env_1.BREVO_FROM_EMAIL,
                name: env_1.BREVO_FROM_NAME,
            },
            to: [
                {
                    email: to,
                },
            ],
            subject,
            htmlContent: html,
        });
        return result;
    }
    catch (error) {
        console.error("Brevo email sending failed:", error);
        throw new Error("Failed to send email");
    }
};
exports.sendEmail = sendEmail;
