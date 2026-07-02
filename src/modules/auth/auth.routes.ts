import express from "express";
const router = express.Router();
import {register, login, getCurrentUser}from "./auth.controller";
import { verifyToken } from "../../middleware/auth.middleware";

router.post("/register", register);
router.post("/login", login);
router.get("/me", verifyToken, getCurrentUser);
export default router;