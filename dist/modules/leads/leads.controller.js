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
exports.getLeadOptions = exports.updateLeadStatus = exports.assignLeads = exports.deleteLead = exports.updateLeadDetails = exports.getLeadById = exports.createLead = exports.getLeads = void 0;
const leadsService = __importStar(require("./leads.service"));
const auth_helper_1 = require("../auth/auth.helper");
const getLeads = async (req, res, next) => {
    try {
        const leads = await leadsService.getLeads(req.user.organization_id, req.user.id, {
            page: req.query.page
                ? Number(req.query.page)
                : 1,
            limit: req.query.limit
                ? Number(req.query.limit)
                : 10,
            status: req.query.status
                ?.toString()
                .toUpperCase(),
            search: req.query.search
                ?.toString()
        }, (0, auth_helper_1.hasPermission)(req.user.permissions, "leads:view_unassigned"));
        res.status(200).json({ message: "leads fetch successfully", data: leads });
    }
    catch (error) {
        next(error);
    }
};
exports.getLeads = getLeads;
const createLead = async (req, res, next) => {
    try {
        // return res.status(200).json({ status: "testing", req: req.user });
        const lead = await leadsService.createLead(req.user.organization_id, req.user.id, req.body);
        res.status(200).json({ message: "leads created successfully", data: lead });
    }
    catch (error) {
        next(error);
    }
};
exports.createLead = createLead;
const getLeadById = async (req, res, next) => {
    try {
        const lead = await leadsService.getLeadById(Number(req.params.id), req.user.organization_id);
        res.status(200).json({
            message: "Lead fetched successfully",
            data: lead,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getLeadById = getLeadById;
const updateLeadDetails = async (req, res, next) => {
    try {
        const lead = await leadsService.updateLeadDetails(Number(req.params.id), Number(req.user.id), Number(req.user.organization_id), req.user.role, req.body);
        res.status(200).json({
            message: "Lead updated successfully",
            data: lead,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.updateLeadDetails = updateLeadDetails;
const deleteLead = async (req, res, next) => {
    try {
        await leadsService.deleteLead(Number(req.params.id), req.user.organization_id);
        res.status(200).json({
            message: "Lead deleted successfully",
        });
    }
    catch (error) {
        next(error);
    }
};
exports.deleteLead = deleteLead;
const assignLeads = async (req, res, next) => {
    try {
        const { leadIds, assignedTo } = req.body;
        await leadsService.assignLeads(req.user.id, req.user.fullname, leadIds, assignedTo);
        res.status(200).json({
            status: "success",
            message: "Leads assigned successfully",
        });
    }
    catch (error) {
        next(error);
    }
};
exports.assignLeads = assignLeads;
const updateLeadStatus = async (req, res, next) => {
    try {
        const { status } = req.body;
        const lead = await leadsService.updateLeadStatus(Number(req.params.id), Number(req.user.id), Number(req.user.organization_id), status, req.user.fullname);
        res.status(200).json({
            status: "success",
            message: "Lead status updated successfully",
            data: lead,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.updateLeadStatus = updateLeadStatus;
const getLeadOptions = async (req, res, next) => {
    try {
        const result = await leadsService.getLeadOptions(req.user.organization_id, req.user.id, {
            search: req.query.search
                ?.toString(),
            page: req.query.page
                ? Number(req.query.page)
                : 1,
            limit: req.query.limit
                ? Number(req.query.limit)
                : 10,
        }, (0, auth_helper_1.hasPermission)(req.user.permissions, "leads:view_unassigned"));
        res.status(200).json({
            status: "success",
            data: result,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getLeadOptions = getLeadOptions;
