const router = require('express').Router();
const c = require('../controllers/rosters.controller');

router.get('/rosters', c.listar);
router.get('/rosters/:id', c.obtener);
router.post('/rosters', c.crear);
router.put('/rosters/:id', c.actualizar);
router.delete('/rosters/:id', c.eliminar);
router.get('/rosters/:id/jugadores', c.listarJugadores);
router.post('/rosters/:id/jugadores', c.asignar);
router.put('/rosters/:id/jugadores/:id_jugador', c.cambiarRol);
router.delete('/rosters/:id/jugadores/:id_jugador', c.quitar);
module.exports = router;