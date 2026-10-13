const router = require('express').Router();
const { ROLES, ESTADOS, TIPOS_ROSTER } = require('../constantes');

router.get('/health', (req, res) => res.json({ status: 'ok' }));
router.get('/roles', (req, res) => res.json(ROLES));
router.get('/estados', (req, res) => res.json(ESTADOS));
router.get('/tipos-roster', (req, res) => res.json(TIPOS_ROSTER));

module.exports = router;