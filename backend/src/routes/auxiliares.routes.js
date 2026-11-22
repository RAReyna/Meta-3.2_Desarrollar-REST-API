import { Router } from "express";
import { ROLES, ESTADOS, TIPOS_ROSTER } from "../constantes.js";

const router = Router();

router.get("/health", (req, res) => res.json({ status: "ok" }));
router.get("/roles", (req, res) => res.json(ROLES));
router.get("/estados", (req, res) => res.json(ESTADOS));
router.get("/tipos-roster", (req, res) => res.json(TIPOS_ROSTER));

export default router;
