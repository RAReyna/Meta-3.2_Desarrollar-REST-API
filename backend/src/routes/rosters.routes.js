import { Router } from "express";
import * as rosters from "../controllers/rosters.controller.js";

const router = Router();

router.get("/rosters", rosters.listar);
router.get("/rosters/:id", rosters.obtener);
router.post("/rosters", rosters.crear);
router.put("/rosters/:id", rosters.actualizar);
router.delete("/rosters/:id", rosters.eliminar);

// Asignación de jugadores al roster
router.get("/rosters/:id/jugadores", rosters.listarJugadores);
router.post("/rosters/:id/jugadores", rosters.asignar);
router.put("/rosters/:id/jugadores/:id_jugador", rosters.cambiarRol);
router.delete("/rosters/:id/jugadores/:id_jugador", rosters.quitar);

export default router;
