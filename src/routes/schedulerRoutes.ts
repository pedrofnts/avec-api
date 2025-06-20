import { Router } from "express";
import * as schedulerController from "../controllers/schedulerController";

const router = Router();

// Rota para buscar agendamentos
router.post("/read", schedulerController.getSchedules);

// Rota para buscar horários disponíveis
router.post(
  "/availability-periods",
  schedulerController.getAvailabilityPeriods
);

// Rota para submeter agendamento
router.post("/submit-availability", schedulerController.submitAvailability);

// Rota para atualizar status de agendamento
router.post("/update-status", schedulerController.updateStatus);

// Rota para buscar detalhes de um agendamento por ID
router.get("/:id", schedulerController.getScheduleById);

// Rota para buscar agendamentos dos próximos 6 meses
router.get("/upcoming", schedulerController.getUpcomingSchedules);

export default router;
