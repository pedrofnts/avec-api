import { Router } from "express";
import * as clientController from "../controllers/clientController";

const router = Router();

// Rota para listar todos os clientes
router.get("/list", clientController.listClients);

// Rota para buscar aniversariantes por data
router.get("/birthdays", clientController.getBirthdayClients);

export default router;
