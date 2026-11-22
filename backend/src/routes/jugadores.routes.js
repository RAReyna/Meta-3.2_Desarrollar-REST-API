import { Router } from "express";
import * as jugadores from "../controllers/jugadores.controller.js";

const router = Router();

router.get("/jugadores", jugadores.listar);
router.get("/jugadores/:id", jugadores.obtener);
router.post("/jugadores", jugadores.crear);
router.put("/jugadores/:id", jugadores.actualizar);
router.delete("/jugadores/:id", jugadores.eliminar);

export default router;
