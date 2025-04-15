import { Router } from "express";
import * as organizationalStructureController from "../controllers/organizationalStructureController";

const router = Router();

// Rota para listar estruturas organizacionais (unidades)
router.post(
  "/",
  organizationalStructureController.listOrganizationalStructures
);

// Rota para definir a estrutura organizacional atual
router.post(
  "/set-current",
  organizationalStructureController.setCurrentOrganizationalStructure
);

export default router;
