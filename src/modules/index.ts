import express from "express";
import authRoutes from "./auth/auth.routes";
import leadRoutes from "./leads/leads.routes";
import rolesRoutes from "./roles/roles.routes";
import usersRoutes from "./users/users.routes";
import activitiesRoutes from "./activities/activities.routes";
import notesRoutes from "./notes/notes.routes";
import tasksRoutes from "./tasks/tasks.routes";
import customersRoutes from "./customers/customers.routes";
import servicesRoutes from "./services/services.routes";
import dealsRoutes from "./deals/deals.routes";
import dashboardRoutes from "./dashboard/dashboard.routes";
import notificationsRoutes from "./notifications/notification.routes";
import organizationsRoutes from "./organizations/organizations.routes";
import searchRoutes from "./search/search.routes";
import contactRoutes from "./contact/contact.routes";

import type { Request, Response } from "express";

const router = express.Router();


// Register module routes
router.use("/auth", authRoutes);
router.use("/leads", leadRoutes);
router.use("/roles", rolesRoutes);
router.use("/users", usersRoutes);
router.use("/activities", activitiesRoutes);
router.use("/notes", notesRoutes);
router.use("/tasks", tasksRoutes);
router.use("/customers", customersRoutes);
router.use("/services", servicesRoutes);
router.use("/deals", dealsRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/notifications", notificationsRoutes);
router.use("/organizations", organizationsRoutes);
router.use("/search", searchRoutes);
router.use("/contact", contactRoutes);

router.get("/health", (req: Request, res: Response) => {
    res.json({ message: "OK" });
});

export default router; 