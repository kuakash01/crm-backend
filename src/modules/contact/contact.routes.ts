import express from "express";
import { submitContactMessage } from "./contact.controller";
import { publicLeadLimiter } from "../../middleware/rateLimiter.middleware";

const router = express.Router();

// Public developer contact route (Rate-limited + honeypot protected)
router.post("/", publicLeadLimiter, submitContactMessage);

export default router;
