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
exports.updateMyProfile = exports.getMyProfile = exports.cancelInvitation = exports.resendInvitation = exports.getPendingInvitations = exports.getAssignableUsers = exports.deleteUser = exports.changeStatus = exports.changeRole = exports.updateUser = exports.createUser = exports.getUser = exports.getUsers = void 0;
const userService = __importStar(require("./users.service"));
const AppError_1 = require("../../shared/errors/AppError");
const getUsers = async (req, res, next) => {
    try {
        const users = await userService.getUsers(req.user.organization_id);
        res.status(200).json({
            status: "success",
            data: users,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getUsers = getUsers;
const getUser = async (req, res, next) => {
    try {
        const user = await userService.getUser(Number(req.params.id), req.user.organization_id);
        res.status(200).json({
            status: "success",
            data: user,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getUser = getUser;
const createUser = async (req, res, next) => {
    try {
        const user = await userService.createUser(req.body, req.user.organization_id);
        res.status(201).json({
            status: "success",
            message: "User created successfully",
            data: user,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.createUser = createUser;
const updateUser = async (req, res, next) => {
    try {
        await userService.updateUser(Number(req.params.id), req.user.organization_id, {
            fullName: req.body.fullName,
            phone: req.body.phone,
            reportsTo: req.body.reportsTo,
            roleId: req.body.roleId
        });
        res.status(200).json({
            status: "success",
            message: "User updated successfully",
        });
    }
    catch (error) {
        next(error);
    }
};
exports.updateUser = updateUser;
const changeRole = async (req, res, next) => {
    try {
        await userService.changeRole(Number(req.params.id), req.body.roleId, req.user.organization_id, Number(req.user.id));
        res.status(200).json({
            status: "success",
            message: "Role updated successfully",
        });
    }
    catch (error) {
        next(error);
    }
};
exports.changeRole = changeRole;
const changeStatus = async (req, res, next) => {
    try {
        await userService.changeStatus(Number(req.params.id), req.body.isActive, req.user.organization_id, Number(req.user.id));
        res.status(200).json({
            status: "success",
            message: "Status updated successfully",
        });
    }
    catch (error) {
        next(error);
    }
};
exports.changeStatus = changeStatus;
const deleteUser = async (req, res, next) => {
    try {
        await userService.deleteUser(Number(req.params.id), req.user.organization_id);
        res.status(200).json({
            status: "success",
            message: "User deleted successfully",
        });
    }
    catch (error) {
        next(error);
    }
};
exports.deleteUser = deleteUser;
const getAssignableUsers = async (req, res, next) => {
    try {
        const users = await userService.getAssignableUsers(req.user.id);
        res.status(200).json({
            status: "success",
            data: users,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getAssignableUsers = getAssignableUsers;
const getPendingInvitations = async (req, res, next) => {
    try {
        const organizationId = req.user.organization_id;
        const invitations = await userService.getPendingInvitations(organizationId);
        return res.status(200).json({
            status: "success",
            data: invitations,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getPendingInvitations = getPendingInvitations;
const resendInvitation = async (req, res, next) => {
    try {
        const invitationId = Number(req.params.id);
        if (Number.isNaN(invitationId)) {
            throw new AppError_1.AppError("Invalid invitation ID", 400);
        }
        const organizationId = req.user.organization_id;
        const invitation = await userService.resendInvitation(invitationId, organizationId);
        return res.status(200).json({
            status: "success",
            message: "Invitation resent successfully",
            data: invitation,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.resendInvitation = resendInvitation;
const cancelInvitation = async (req, res, next) => {
    try {
        const invitationId = Number(req.params.id);
        if (Number.isNaN(invitationId)) {
            throw new AppError_1.AppError("Invalid invitation ID", 400);
        }
        const organizationId = req.user.organization_id;
        const invitation = await userService.cancelInvitation(invitationId, organizationId);
        return res.status(200).json({
            status: "success",
            message: "Invitation cancelled successfully",
            data: invitation,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.cancelInvitation = cancelInvitation;
const getMyProfile = async (req, res, next) => {
    try {
        const user = await userService.getMyProfile(req.user.id);
        return res.status(200).json({
            status: "success",
            data: user,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getMyProfile = getMyProfile;
const updateMyProfile = async (req, res, next) => {
    try {
        const { fullName, phone, profilePic } = req.body;
        const user = await userService.updateMyProfile(req.user.id, {
            fullName,
            phone,
            profilePic,
        });
        return res.status(200).json({
            status: "success",
            message: "Profile updated successfully",
            data: user,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.updateMyProfile = updateMyProfile;
