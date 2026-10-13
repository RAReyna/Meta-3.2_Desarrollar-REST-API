const db = require('../db');

exports.listar = ({ tipo, temporada }) => {
  let sql = `SELECT r.*, COUNT(rj.id) AS cantidad_jugadores
             FROM rosters r
             LEFT JOIN roster_jugador rj ON rj.id_roster = r.id
             WHERE 1=1`;
  const params = [];
  if (tipo) { sql += ' AND r.tipo = ?'; params.push(tipo); }
  if (temporada) { sql += ' AND r.temporada = ?'; params.push(temporada); }
  return db.prepare(sql + ' GROUP BY r.id ORDER BY r.id').all(...params);
};

exports.obtener = (id) =>
  db.prepare('SELECT * FROM rosters WHERE id = ?').get(id);

exports.jugadoresDe = (idRoster) =>
  db.prepare(`SELECT j.id, j.nickname, j.rol, rj.rol_en_roster
              FROM roster_jugador rj
              JOIN jugadores j ON j.id = rj.id_jugador
              WHERE rj.id_roster = ? ORDER BY rj.id`).all(idRoster);

exports.crear = (d) =>
  db.prepare('INSERT INTO rosters (nombre, juego, tipo, temporada) VALUES (?, ?, ?, ?)')
    .run(d.nombre, d.juego, d.tipo, d.temporada);

exports.actualizar = (id, d) =>
  db.prepare('UPDATE rosters SET nombre = ?, juego = ?, tipo = ?, temporada = ? WHERE id = ?')
    .run(d.nombre, d.juego, d.tipo, d.temporada, id);

exports.eliminar = (id) =>
  db.prepare('DELETE FROM rosters WHERE id = ?').run(id);

exports.obtenerAsignacion = (idRoster, idJugador) =>
  db.prepare('SELECT * FROM roster_jugador WHERE id_roster = ? AND id_jugador = ?')
    .get(idRoster, idJugador);

exports.titularesDe = (idRoster, excluirIdJugador = 0) =>
  db.prepare(`SELECT j.rol FROM roster_jugador rj
              JOIN jugadores j ON j.id = rj.id_jugador
              WHERE rj.id_roster = ? AND rj.rol_en_roster = 'Titular' AND rj.id_jugador != ?`)
    .all(idRoster, excluirIdJugador);

exports.asignar = (idRoster, idJugador, rolEnRoster) =>
  db.prepare('INSERT INTO roster_jugador (id_roster, id_jugador, rol_en_roster) VALUES (?, ?, ?)')
    .run(idRoster, idJugador, rolEnRoster);

exports.cambiarRol = (idRoster, idJugador, rolEnRoster) =>
  db.prepare('UPDATE roster_jugador SET rol_en_roster = ? WHERE id_roster = ? AND id_jugador = ?')
    .run(rolEnRoster, idRoster, idJugador);

exports.quitar = (idRoster, idJugador) =>
  db.prepare('DELETE FROM roster_jugador WHERE id_roster = ? AND id_jugador = ?')
    .run(idRoster, idJugador);