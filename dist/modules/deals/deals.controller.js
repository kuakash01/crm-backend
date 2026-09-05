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
exports.getDealOptions = exports.assignDeals = exports.deleteDeal = exports.updateDealStage = exports.updateDeal = exports.getDealById = exports.getPipelineDeals = exports.getDeals = exports.createDeal = void 0;
const dealsService = __importStar(require("./deals.service"));
const auth_helper_1 = require("../auth/auth.helper");
const createDeal = async (req, res, next) => {
    try {
        const deal = await dealsService.createDeal(req.user.organization_id, req.user.id, req.body);
        res.status(201).json({
            status: "success",
            data: deal,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.createDeal = createDeal;
const getDeals = async (req, res, next) => {
    try {
        const result = await dealsService.getDeals(req.user.organization_id, req.user.id, {
            page: req.query.page
                ? Number(req.query.page)
                : 1,
            limit: req.query.limit
                ? Number(req.query.limit)
                : 10,
            stage: req.query.stage
                ?.toString()
                .toUpperCase(),
            search: req.query.search
                ?.toString()
        }, (0, auth_helper_1.hasPermission)(req.user.permissions, "leads:view_unassigned"));
        res.status(200).json({
            status: "success",
            data: result
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getDeals = getDeals;
const getPipelineDeals = async (req, res, next) => {
    try {
        const deals = await dealsService.getPipelineDeals(Number(req.user.organization_id), req.user.id, (0, auth_helper_1.hasPermission)(req.user.permissions, "leads:view_unassigned"));
        res.status(200).json({
            status: "success",
            data: deals,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getPipelineDeals = getPipelineDeals;
const getDealById = async (req, res, next) => {
    try {
        const deal = await dealsService.getDealById(Number(req.params.id), req.user.organization_id, req.user.id, req.user.role);
        res.status(200).json({
            status: "success",
            data: deal
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getDealById = getDealById;
const updateDeal = async (req, res, next) => {
    try {
        const deal = await dealsService.updateDeal(Number(req.params.id), req.user.organization_id, req.user.id, req.user.role, req.body);
        res.status(200).json({
            status: "success",
            data: deal
        });
    }
    catch (error) {
        next(error);
    }
};
exports.updateDeal = updateDeal;
const updateDealStage = async (req, res, next) => {
    try {
        const deal = await dealsService.updateDealStage(Number(req.params.id), req.user.organization_id, req.user.id, req.body.stage);
        res.status(200).json({
            status: "success",
            data: deal
        });
    }
    catch (error) {
        next(error);
    }
};
exports.updateDealStage = updateDealStage;
const deleteDeal = async (req, res, next) => {
    try {
        await dealsService.deleteDeal(Number(req.params.id), req.user.organization_id);
        res.status(200).json({
            status: "success"
        });
    }
    catch (error) {
        next(error);
    }
};
exports.deleteDeal = deleteDeal;
const assignDeals = async (req, res, next) => {
    try {
        const result = await dealsService.assignDeals(req.user.organization_id, req.user.id, req.user.fullname, req.body.dealIds, req.body.assignedTo);
        res.status(200).json({
            status: "success",
            data: result,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.assignDeals = assignDeals;
const getDealOptions = async (req, res, next) => {
    try {
        const result = await dealsService.getDealOptions(req.user.organization_id, req.user.id, {
            search: req.query.search?.toString(),
            page: req.query.page
                ? Number(req.query.page)
                : 1,
            limit: req.query.limit
                ? Number(req.query.limit)
                : 10,
        }, (0, auth_helper_1.hasPermission)(req.user.permissions, "deals:view_unassigned"));
        res.status(200).json({
            status: "success",
            data: result,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getDealOptions = getDealOptions;
