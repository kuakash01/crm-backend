"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteTask = exports.updateTaskStatus = exports.updateTask = exports.getTaskById = exports.getAllTasks = exports.createTask = void 0;
const taskService = __importStar(require("./tasks.service"));
const AppError_1 = require("../../shared/errors/AppError");
// task controller starts
const createTask = async (req, res, next) => {
    try {
        const task = await taskService.createTask(req.user.organization_id, req.user.id, {
            ...req.body,
            entity_type: req.body.entity_type
                ?.toString()
                .toUpperCase() ?? null,
            entity_id: req.body.entity_id
                ? Number(req.body.entity_id)
                : null,
        });
        res.status(201).json({
            status: "success",
            data: task,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.createTask = createTask;
const getAllTasks = async (req, res) => {
    try {
        const { organization_id, id } = req.user;
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;
        const search = String(req.query.search || "");
        const status = req.query.status
            ?.toString()
            .toUpperCase();
        const entityType = req.query.entityType
            ?.toString()
            .toUpperCase();
        const priority = req.query.priority
            ?.toString()
            .toUpperCase();
        const data = await taskService.getAllTasksService({
            organizationId: organization_id,
            currentUserId: id,
            page,
            limit,
            search,
            status,
            entityType,
            priority,
        });
        res.status(200).json({
            success: true,
            message: "Tasks fetched successfully.",
            data,
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch tasks.",
        });
    }
};
exports.getAllTasks = getAllTasks;
const getTaskById = async (req, res, next) => {
    try {
        const organizationId = req.user.organization_id;
        const taskId = Number(req.params.taskId);
        if (Number.isNaN(taskId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid task ID",
            });
        }
        const task = await taskService.getTaskById(organizationId, taskId);
        return res.status(200).json({
            success: true,
            data: task,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getTaskById = getTaskById;
const updateTask = async (req, res, next) => {
    try {
        const organizationId = req.user.organization_id;
        const taskId = Number(req.params.taskId);
        if (Number.isNaN(taskId)) {
            throw new AppError_1.AppError("Invalid task ID", 400);
        }
        const task = await taskService.updateTask(organizationId, req.user.id, taskId, req.body);
        return res.status(200).json({
            success: true,
            message: "Task updated successfully",
            data: task,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.updateTask = updateTask;
const updateTaskStatus = async (req, res, next) => {
    try {
        const organizationId = req.user.organization_id;
        const currentUserId = req.user.id;
        const taskId = Number(req.params.taskId);
        if (Number.isNaN(taskId)) {
            throw new AppError_1.AppError("Invalid task ID", 400);
        }
        const { status } = req.body;
        if (status !== "PENDING" &&
            status !== "COMPLETED") {
            throw new AppError_1.AppError("Invalid task status", 400);
        }
        const task = await taskService.updateTaskStatus(organizationId, taskId, status, currentUserId);
        return res.status(200).json({
            success: true,
            message: "Task status updated successfully",
            data: task,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.updateTaskStatus = updateTaskStatus;
const deleteTask = async (req, res, next) => {
    try {
        const organizationId = req.user.organization_id;
        const taskId = Number(req.params.taskId);
        if (Number.isNaN(taskId)) {
            throw new AppError_1.AppError("Invalid task ID", 400);
        }
        await taskService.deleteTask(organizationId, taskId);
        return res.status(200).json({
            success: true,
            message: "Task deleted successfully",
        });
    }
    catch (error) {
        next(error);
    }
};
exports.deleteTask = deleteTask;
