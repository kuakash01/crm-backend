"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
const tasks_controller_1 = require("./tasks.controller");
const auth_middleware_1 = require("../../middleware/auth.middleware");
router.use(auth_middleware_1.verifyToken);
// task routes
router.post("/", (0, auth_middleware_1.authorize)("tasks", "create"), tasks_controller_1.createTask);
router.get("/", (0, auth_middleware_1.authorize)("tasks", "read"), tasks_controller_1.getAllTasks);
router.get("/:taskId", tasks_controller_1.getTaskById);
router.put("/:taskId", tasks_controller_1.updateTask);
router.patch("/:taskId/status", tasks_controller_1.updateTaskStatus);
router.delete("/:taskId", tasks_controller_1.deleteTask);
exports.default = router;
