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

// Rota para listar clientes simplificada
router.get("/list", clientController.listClients);

export default router;
