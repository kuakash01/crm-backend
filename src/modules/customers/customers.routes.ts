import express from "express";
import * as customersController from "./customers.controller";
import { verifyToken, authorize } from "../../middleware/auth.middleware";

const router = express.Router();

router.use(verifyToken);

router.post(
  "/",
  authorize("customers", "create"),
  customersController.createCustomer
);
router.post(
  "/assign",
  verifyToken,
  authorize("customers", "assign"),
  customersController.assignCustomer,
);
router.get(
  "/",
  authorize("customers", "read"),
  customersController.getCustomers
);

router.get(
  "/:id/deals",
  authorize("deals", "read"),
  customersController.getCustomerDeals
);

router.get(
  "/:id",
  authorize("customers", "read"),
  customersController.getCustomerById
);

router.patch(
  "/:id",
  authorize("customers", "update"),
  customersController.updateCustomer
);

router.patch(
  "/:id/status",
  authorize("customers", "update"),
  customersController.updateCustomerStatus
);

router.delete(
  "/:id",
  authorize("customers", "delete"),
  customersController.deleteCustomer
);



export default router;