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
exports.getServiceOptions = exports.deleteService = exports.updateService = exports.getServiceById = exports.getServices = exports.createService = void 0;
const servicesService = __importStar(require("./services.service"));
const createService = async (req, res, next) => {
    try {
        const service = await servicesService.createService(req.user.organization_id, req.body);
        res.status(201).json({
            status: "success",
            data: service
        });
    }
    catch (error) {
        next(error);
    }
};
exports.createService = createService;
const getServices = async (req, res, next) => {
    try {
        const services = await servicesService.getServices(req.user.organization_id, {
            search: req.query.search?.toString(),
            page: req.query.page
                ? Number(req.query.page)
                : 1,
            limit: req.query.limit
                ? Number(req.query.limit)
                : 10,
            includeInactive: req.query.includeInactive === "true",
        });
        res.status(200).json({
            status: "success",
            data: services,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getServices = getServices;
const getServiceById = async (req, res, next) => {
    try {
        const service = await servicesService.getServiceById(Number(req.params.id), req.user.organization_id);
        res.status(200).json({
            status: "success",
            data: service
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getServiceById = getServiceById;
const updateService = async (req, res, next) => {
    try {
        const service = await servicesService.updateService(Number(req.params.id), req.user.organization_id, req.body);
        res.status(200).json({
            status: "success",
            data: service
        });
    }
    catch (error) {
        next(error);
    }
};
exports.updateService = updateService;
const deleteService = async (req, res, next) => {
    try {
        await servicesService.deleteService(Number(req.params.id), req.user.organization_id);
        res.status(200).json({
            status: "success",
            message: "Service deleted successfully"
        });
    }
    catch (error) {
        next(error);
    }
};
exports.deleteService = deleteService;
const getServiceOptions = async (req, res, next) => {
    try {
        const { organization_id, } = req.user;
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;
        const search = String(req.query.search || "");
        const services = await servicesService.getServiceOptions(organization_id, {
            search,
            page,
            limit,
        });
        res.status(200).json({
            status: "success",
            data: services,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getServiceOptions = getServiceOptions;
