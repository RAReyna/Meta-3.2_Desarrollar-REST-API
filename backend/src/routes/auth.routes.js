import { Router } from "express";
import * as auth from "../controllers/auth.controller.js";
import { autenticar, verificarCsrf } from "../middleware/auth.js";

const router = Router();

router.post("/login", auth.login);
router.post("/registro", auth.registro);
router.post("/logout", autenticar, verificarCsrf, auth.logout);
router.get("/me", autenticar, auth.me);

export default router;
