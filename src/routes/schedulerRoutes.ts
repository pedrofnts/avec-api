import { Router } from "express";
import * as schedulerController from "../controllers/schedulerController";

const router = Router();

// Rota para buscar agendamentos
router.post("/read", schedulerController.getSchedules);

// Rota para buscar detalhes de um agendamento (viewAgendaInfo)
router.post("/details", schedulerController.getScheduleDetails);

// Rota para obter todos os status disponíveis
router.get("/status", schedulerController.getAvailableStatus);

export default router;
