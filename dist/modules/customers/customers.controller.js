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
exports.getCustomerOptions = exports.getCustomerDeals = exports.assignCustomer = exports.deleteCustomer = exports.updateCustomerStatus = exports.updateCustomer = exports.getCustomerById = exports.getCustomers = exports.createCustomer = void 0;
const customersService = __importStar(require("./customers.service"));
const createCustomer = async (req, res, next) => {
    try {
        const customer = await customersService.createCustomer(req.user.organization_id, req.user.id, req.body);
        res.status(201).json({
            status: "success",
            data: customer
        });
    }
    catch (error) {
        next(error);
    }
};
exports.createCustomer = createCustomer;
const getCustomers = async (req, res, next) => {
    try {
        const customers = await customersService.getCustomers(req.user.organization_id, req.user.id, {
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
        });
        res.status(200).json({
            status: "success",
            data: customers
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getCustomers = getCustomers;
const getCustomerById = async (req, res, next) => {
    try {
        const customer = await customersService.getCustomerById(req.user.organization_id, Number(req.params.id));
        res.status(200).json({
            status: "success",
            data: customer
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getCustomerById = getCustomerById;
const updateCustomer = async (req, res, next) => {
    try {
        const customer = await customersService.updateCustomer(req.user.organization_id, Number(req.params.id), req.user.id, req.body);
        res.status(200).json({
            status: "success",
            data: customer
        });
    }
    catch (error) {
        next(error);
    }
};
exports.updateCustomer = updateCustomer;
const updateCustomerStatus = async (req, res, next) => {
    try {
        const customer = await customersService.updateCustomerStatus(req.user.organization_id, Number(req.params.id), req.body.status, req.user.id);
        res.status(200).json({
            status: "success",
            data: customer
        });
    }
    catch (error) {
        next(error);
    }
};
exports.updateCustomerStatus = updateCustomerStatus;
const deleteCustomer = async (req, res, next) => {
    try {
        await customersService.deleteCustomer(req.user.organization_id, Number(req.params.id));
        res.status(200).json({
            status: "success"
        });
    }
    catch (error) {
        next(error);
    }
};
exports.deleteCustomer = deleteCustomer;
const assignCustomer = async (req, res, next) => {
    try {
        const { customerIds, assignedTo } = req.body;
        await customersService.assignCustomer(req.user.id, customerIds, assignedTo);
        res.status(200).json({
            status: "success",
            message: "Leads assigned successfully",
        });
    }
    catch (error) {
        next(error);
    }
};
exports.assignCustomer = assignCustomer;
const getCustomerDeals = async (req, res, next) => {
    try {
        const deals = await customersService.getCustomerDeals(Number(req.params.id), req.user.organization_id);
        res.status(200).json({
            status: "success",
            data: deals
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getCustomerDeals = getCustomerDeals;
const getCustomerOptions = async (req, res) => {
    const organizationId = req.user.organization_id;
    const currentUserId = req.user.id;
    const { q, page, limit, } = req.query;
    const customers = await customersService.getCustomerOptions(organizationId, currentUserId, {
        search: q,
        page: Number(page) || 1,
        limit: Number(limit) || 10,
    });
    res.status(200).json({
        status: "success",
        data: customers,
        message: "Customer options fetched successfully"
    });
};
exports.getCustomerOptions = getCustomerOptions;
