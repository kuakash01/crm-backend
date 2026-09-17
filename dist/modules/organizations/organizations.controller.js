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
exports.regenerateInboundKey = exports.updateMyOrganization = exports.getMyOrganization = void 0;
const AppError_1 = require("../../shared/errors/AppError");
const organizations_schema_1 = require("./organizations.schema");
const organizationService = __importStar(require("./organizations.service"));
const getMyOrganization = async (req, res, next) => {
    try {
        const organization = await organizationService.getOrganization(req.user.organization_id);
        res.status(200).json({
            status: "success",
            data: organization,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getMyOrganization = getMyOrganization;
const updateMyOrganization = async (req, res, next) => {
    try {
        const parsed = organizations_schema_1.updateOrganizationSchema.safeParse(req.body);
        if (!parsed.success) {
            throw new AppError_1.AppError(parsed.error.issues[0]?.message ?? "Invalid organization data", 400);
        }
        const organization = await organizationService.updateOrganization(req.user.organization_id, parsed.data);
        res.status(200).json({
            status: "success",
            message: "Organization details updated successfully",
            data: organization,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.updateMyOrganization = updateMyOrganization;
const regenerateInboundKey = async (req, res, next) => {
    try {
        const result = await organizationService.regenerateInboundKey(req.user.organization_id);
        res.status(200).json({
            status: "success",
            message: "Inbound API key regenerated successfully",
            data: result,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.regenerateInboundKey = regenerateInboundKey;
