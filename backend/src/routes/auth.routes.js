const { Router } = require("express");
const controller = require("../controllers/auth.controller");
const { autenticar, verificarCsrf } = require("../middleware/auth");

const router = Router();

router.post("/login", controller.login);
router.post("/registro", controller.registro);
router.post("/logout", autenticar, verificarCsrf, controller.logout);
router.get("/me", autenticar, controller.me);

module.exports = router;
