import express from "express";
const router = express.Router();
import * as leadsController from "./leads.controller";
import { verifyToken, authorize } from "../../middleware/auth.middleware";

router.use(verifyToken);

router.get('/', authorize("leads", "read"), leadsController.getLeads);
router.post('/', authorize("leads", "create"), leadsController.createLead)
router.post(
  "/assign",
  verifyToken,
  authorize("leads", "assign"),
  leadsController.assignLeads,
);
router.get("/:id", authorize("leads", "read"), leadsController.getLeadById);
router.patch("/:id", authorize("leads", "update"), leadsController.updateLeadDetails);
router.delete("/:id", authorize("leads", "delete"), leadsController.deleteLead);
router.patch(
  "/:id/status",
  leadsController.updateLeadStatus
);


export default router;