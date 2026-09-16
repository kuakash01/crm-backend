import { Router } from "express";
import { verifyToken } from "../../middleware/auth.middleware";
import { searchWorkspace } from "./search.controller";

const router = Router();

router.get("/", verifyToken, searchWorkspace);

export default router;
