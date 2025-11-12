import express, { Router } from "express";
import * as authController from "../controllers/authController";

const router = Router();

// Rota para login
router.post("/login", authController.login);

export default router;
