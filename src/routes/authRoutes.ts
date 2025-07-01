import express, { Router } from "express";
import * as authController from "../controllers/authController";

const router = Router();

// Rota para login
router.post("/login", authController.login);

// Rota para teste de login com credenciais padrão
router.post("/test-login", authController.testLogin);

export default router;
