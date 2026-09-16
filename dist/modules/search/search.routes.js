"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const search_controller_1 = require("./search.controller");
const router = (0, express_1.Router)();
router.get("/", auth_middleware_1.verifyToken, search_controller_1.searchWorkspace);
exports.default = router;
