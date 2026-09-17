"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const contact_controller_1 = require("./contact.controller");
const rateLimiter_middleware_1 = require("../../middleware/rateLimiter.middleware");
const router = express_1.default.Router();
// Public developer contact route (Rate-limited + honeypot protected)
router.post("/", rateLimiter_middleware_1.publicLeadLimiter, contact_controller_1.submitContactMessage);
exports.default = router;
