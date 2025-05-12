import { Router } from "express";
import * as clientController from "../controllers/clientController";

const router = Router();

// Rota para buscar clientes
router.get("/search", clientController.searchClients);

// Rota para listar clientes filtrados
router.post("/list-filtered", clientController.listFilteredClients);

// Rota para buscar aniversariantes do dia
router.post("/birthdays", clientController.getBirthdaysByDate);

// Rota para buscar todos os clientes de uma unidade (GET na raiz)
router.get("/", clientController.getAllClientsByUnit);

export default router;
