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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const customersController = __importStar(require("./customers.controller"));
const auth_middleware_1 = require("../../middleware/auth.middleware");
const router = express_1.default.Router();
router.use(auth_middleware_1.verifyToken);
router.post("/", (0, auth_middleware_1.authorize)("customers", "create"), customersController.createCustomer);
router.post("/assign", auth_middleware_1.verifyToken, (0, auth_middleware_1.authorize)("customers", "assign"), customersController.assignCustomer);
router.get("/", (0, auth_middleware_1.authorize)("customers", "read"), customersController.getCustomers);
router.get("/options", (0, auth_middleware_1.authorize)("customers", "read"), customersController.getCustomerOptions);
router.get("/:id/deals", (0, auth_middleware_1.authorize)("deals", "read"), customersController.getCustomerDeals);
router.get("/:id", (0, auth_middleware_1.authorize)("customers", "read"), customersController.getCustomerById);
router.patch("/:id", (0, auth_middleware_1.authorize)("customers", "update"), customersController.updateCustomer);
router.patch("/:id/status", (0, auth_middleware_1.authorize)("customers", "update"), customersController.updateCustomerStatus);
router.delete("/:id", (0, auth_middleware_1.authorize)("customers", "delete"), customersController.deleteCustomer);
exports.default = router;
