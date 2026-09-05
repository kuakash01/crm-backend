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
exports.updateRolePermissions = exports.getRolePermissions = exports.deleteRole = exports.updateRole = exports.createRole = exports.getRoles = void 0;
const roleService = __importStar(require("./roles.service"));
const getRoles = async (req, res, next) => {
    try {
        const roles = await roleService.getRoles(req.user.organization_id);
        res.status(200).json({
            data: roles,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getRoles = getRoles;
const createRole = async (req, res, next) => {
    try {
        const role = await roleService.createRole(req.user.organization_id, req.body);
        res.status(201).json({
            message: "Role created successfully",
            data: role,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.createRole = createRole;
const updateRole = async (req, res, next) => {
    try {
        const role = await roleService.updateRole(Number(req.params.id), req.user.organization_id, req.body);
        res.status(200).json({
            message: "Role updated successfully",
            data: role,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.updateRole = updateRole;
const deleteRole = async (req, res, next) => {
    try {
        await roleService.deleteRole(Number(req.params.id), req.user.organization_id);
        res.status(200).json({
            message: "Role deleted successfully",
        });
    }
    catch (error) {
        next(error);
    }
};
exports.deleteRole = deleteRole;
const getRolePermissions = async (req, res, next) => {
    try {
        const data = await roleService.getRolePermissions(Number(req.params.id), req.user.organization_id);
        res.status(200).json({
            message: "Permissions fetched successfully",
            data,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getRolePermissions = getRolePermissions;
const updateRolePermissions = async (req, res, next) => {
    try {
        const { permissionIds } = req.body;
        await roleService.updateRolePermissions(Number(req.params.id), req.user.organization_id, permissionIds);
        res.status(200).json({
            message: "Permissions updated successfully",
        });
    }
    catch (error) {
        next(error);
    }
};
exports.updateRolePermissions = updateRolePermissions;
