import { Router } from "express";
import * as comandaController from "../controllers/comandaController";

const router = Router();

// Rota para listar comandas por data com detalhes completos
router.get("/list", comandaController.listComandas);

export default router;
