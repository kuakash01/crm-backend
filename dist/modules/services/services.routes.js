"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const services_controller_1 = require("./services.controller");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const router = express_1.default.Router();
router.use(auth_middleware_1.verifyToken);
router.post("/", (0, auth_middleware_1.authorize)("services", "create"), services_controller_1.createService);
router.get("/", (0, auth_middleware_1.authorize)("services", "read"), services_controller_1.getServices);
router.get("/options", (0, auth_middleware_1.authorize)("services", "read"), services_controller_1.getServiceOptions);
router.get("/:id", (0, auth_middleware_1.authorize)("services", "read"), services_controller_1.getServiceById);
router.patch("/:id", (0, auth_middleware_1.authorize)("services", "update"), services_controller_1.updateService);
router.delete("/:id", (0, auth_middleware_1.authorize)("services", "delete"), services_controller_1.deleteService);
exports.default = router;
