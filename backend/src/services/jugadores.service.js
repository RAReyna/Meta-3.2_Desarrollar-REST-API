import pool, { armarWhere } from "../db.js";
import { HttpError } from "../errors.js";

export async function obtener(id) {
  const sql = "SELECT * FROM jugadores WHERE id = ?";
  const [[jugador]] = await pool.query(sql, [id]);
  if (!jugador) throw new HttpError(404, "Jugador no encontrado");
  return jugador;
}

export async function listar({ rol, estado, search }) {
  const filtros = [];
  if (rol) filtros.push(["rol = ?", rol]);
  if (estado) filtros.push(["estado = ?", estado]);
  if (search) filtros.push(["nickname LIKE ?", `%${search}%`]);

  const { where, valores } = armarWhere(filtros);
  const sql = `SELECT * FROM jugadores ${where} ORDER BY id`;
  const [jugadores] = await pool.query(sql, valores);
  return jugadores;
}

// RN-01: el nickname es único (el collation ignora mayúsculas).
// idActual: al editar, el propio jugador no cuenta como duplicado.
async function validarNickname(nickname, idActual = 0) {
  const sql = "SELECT id FROM jugadores WHERE nickname = ? AND id <> ?";
  const [[otro]] = await pool.query(sql, [nickname, idActual]);
  if (otro) throw new HttpError(409, "El nickname ya existe");
}

// Los campos opcionales que no llegan se guardan como null.
const valoresDe = (datos) => [
  datos.nickname,
  datos.nombre_real ?? null,
  datos.pais ?? null,
  datos.rol,
  datos.estado,
];

export async function crear(datos) {
  await validarNickname(datos.nickname);
  const sql = `INSERT INTO jugadores (nickname, nombre_real, pais, rol, estado)
               VALUES (?, ?, ?, ?, ?)`;
  const [resultado] = await pool.query(sql, valoresDe(datos));
  return obtener(resultado.insertId);
}

// PUT reemplaza todos los campos.
export async function actualizar(id, datos) {
  await obtener(id);
  await validarNickname(datos.nickname, id);
  const sql = `UPDATE jugadores
               SET nickname = ?, nombre_real = ?, pais = ?, rol = ?, estado = ?
               WHERE id = ?`;
  await pool.query(sql, [...valoresDe(datos), id]);
  return obtener(id);
}

export async function eliminar(id) {
  const sql = "DELETE FROM jugadores WHERE id = ?";
  const [resultado] = await pool.query(sql, [id]);
  if (resultado.affectedRows === 0) {
    throw new HttpError(404, "Jugador no encontrado");
  }
}
