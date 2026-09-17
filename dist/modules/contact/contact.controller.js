"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.submitContactMessage = void 0;
const zod_1 = require("zod");
const sendEmail_helper_1 = require("../../shared/helpers/sendEmail.helper");
const contactSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, "Name is required").max(100),
    email: zod_1.z.string().email("Valid email is required").max(100),
    phone: zod_1.z.string().max(30).optional().or(zod_1.z.literal("")),
    company: zod_1.z.string().max(100).optional().or(zod_1.z.literal("")),
    topic: zod_1.z.string().max(150).optional().or(zod_1.z.literal("")),
    message: zod_1.z.string().min(1, "Message is required").max(5000),
    website_url: zod_1.z.string().max(200).optional(),
});
const submitContactMessage = async (req, res, next) => {
    try {
        const data = contactSchema.parse(req.body);
        // Anti-bot honeypot check
        if (data.website_url && data.website_url.trim().length > 0) {
            console.warn(`[Contact Form] Dropped bot submission from: ${data.email}`);
            return res.status(200).json({
                success: true,
                message: "Message dispatched successfully.",
            });
        }
        const developerEmail = "ku.akash.04@gmail.com";
        const subject = `[CRM Developer Inquiry] from ${data.name} (${data.email})`;
        const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f2937; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
        <div style="background-color: #0f172a; padding: 20px; color: #ffffff;">
          <h2 style="margin: 0; font-size: 20px;">New Developer &amp; Collaboration Inquiry</h2>
          <p style="margin: 5px 0 0 0; font-size: 13px; color: #94a3b8;">Sent via CRM Platform Contact Channel</p>
        </div>
        <div style="padding: 24px;">
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <tr>
              <td style="padding: 8px 0; color: #64748b; font-weight: bold; width: 120px;">Full Name:</td>
              <td style="padding: 8px 0; font-weight: 600;">${data.name}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #64748b; font-weight: bold;">Email:</td>
              <td style="padding: 8px 0;"><a href="mailto:${data.email}" style="color: #2563eb;">${data.email}</a></td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #64748b; font-weight: bold;">Phone:</td>
              <td style="padding: 8px 0;">${data.phone || "Not provided"}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #64748b; font-weight: bold;">Organization:</td>
              <td style="padding: 8px 0;">${data.company || "Not provided"}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #64748b; font-weight: bold;">Topic:</td>
              <td style="padding: 8px 0;">${data.topic || "General Discussion"}</td>
            </tr>
          </table>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 16px 0;" />
          <h3 style="font-size: 15px; margin-bottom: 8px; color: #0f172a;">Message:</h3>
          <div style="background-color: #f8fafc; padding: 16px; border-radius: 8px; border: 1px solid #e2e8f0; white-space: pre-wrap; font-size: 14px; color: #334155;">${data.message}</div>
        </div>
        <div style="background-color: #f1f5f9; padding: 12px 24px; font-size: 12px; color: #64748b; text-align: center;">
          CRM Platform System • Direct Contact Routing
        </div>
      </div>
    `;
        await (0, sendEmail_helper_1.sendEmail)({
            to: developerEmail,
            subject,
            html,
        });
        res.status(200).json({
            success: true,
            message: "Message dispatched successfully. Akash will get back to you shortly.",
        });
    }
    catch (error) {
        next(error);
    }
};
exports.submitContactMessage = submitContactMessage;
