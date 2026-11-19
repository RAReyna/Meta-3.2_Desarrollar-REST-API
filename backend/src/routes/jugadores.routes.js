const router = require('express').Router();
const c = require('../controllers/jugadores.controller');

router.get('/jugadores', c.listar);
router.get('/jugadores/:id', c.obtener);
router.post('/jugadores', c.crear);
router.put('/jugadores/:id', c.actualizar);
router.delete('/jugadores/:id', c.eliminar);

module.exports = router;