const { Router } = require("express");
const controller = require("../controllers/auth.controller");
const google = require("../controllers/google-auth.controller");
const { autenticar, verificarCsrf } = require("../middleware/auth");

const router = Router();

router.post("/login", controller.login);
router.post("/logout", autenticar, verificarCsrf, controller.logout);
router.get("/me", autenticar, controller.me);
router.get("/google/login", google.login);
router.get("/google/callback", google.callback);

module.exports = router;
