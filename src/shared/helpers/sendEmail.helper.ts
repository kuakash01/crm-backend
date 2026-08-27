// src/shared/helpers/sendEmail.helper.ts

import { BrevoClient } from "@getbrevo/brevo";

import {
  BREVO_API_KEY,
  BREVO_FROM_EMAIL,
  BREVO_FROM_NAME,
} from "../../config/env";

const brevo = new BrevoClient({
  apiKey: BREVO_API_KEY,
});



type SendEmailOptions = {
  to: string;
  subject: string;
  html: string;
};

export const sendEmail = async ({
  to,
  subject,
  html,
}: SendEmailOptions) => {
  try {
    const result =
      await brevo.transactionalEmails.sendTransacEmail(
        {
          sender: {
            email: BREVO_FROM_EMAIL,
            name: BREVO_FROM_NAME,
          },
          to: [
            {
              email: to,
            },
          ],
          subject,
          htmlContent: html,
        },
      );

    return result;
  } catch (error) {
    console.error(
      "Brevo email sending failed:",
      error,
    );

    throw new Error(
      "Failed to send email",
    );
  }
};