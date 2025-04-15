import { Router } from "express";
import * as procedureController from "../controllers/procedureController";

const router = Router();

// Rota para buscar tipos de procedimento
router.get("/types", procedureController.getProcedureTypes);

// Rota para buscar procedimentos disponíveis
router.post("/available", procedureController.getAvailableProcedures);

// Rota para buscar procedimentos de um dia específico
router.post("/daily", procedureController.getDailyProcedures);

export default router;
