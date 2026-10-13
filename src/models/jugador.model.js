const db = require('../db');

exports.listar = ({ rol, estado, search }) => {
  let sql = 'SELECT * FROM jugadores WHERE 1=1';
  const params = [];
  if (rol) { sql += ' AND rol = ?'; params.push(rol); }
  if (estado) { sql += ' AND estado = ?'; params.push(estado); }
  if (search) { sql += ' AND nickname LIKE ?'; params.push(`%${search}%`); }
  return db.prepare(sql + ' ORDER BY id').all(...params);
};

exports.obtener = (id) =>
  db.prepare('SELECT * FROM jugadores WHERE id = ?').get(id);

exports.obtenerPorNickname = (nickname) =>
  db.prepare('SELECT * FROM jugadores WHERE nickname = ?').get(nickname);

exports.crear = (d) =>
  db.prepare(`INSERT INTO jugadores (nickname, nombre_real, pais, rol, estado)
              VALUES (?, ?, ?, ?, ?)`)
    .run(d.nickname, d.nombre_real ?? null, d.pais ?? null, d.rol, d.estado);

exports.actualizar = (id, d) =>
  db.prepare(`UPDATE jugadores
              SET nickname = ?, nombre_real = ?, pais = ?, rol = ?, estado = ?
              WHERE id = ?`)
    .run(d.nickname, d.nombre_real ?? null, d.pais ?? null, d.rol, d.estado, id);

exports.eliminar = (id) =>
  db.prepare('DELETE FROM jugadores WHERE id = ?').run(id);