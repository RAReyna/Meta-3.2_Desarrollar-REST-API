import pool from "../db.js";

export async function buscarPorEmail(email) {
  const sql = "SELECT * FROM usuarios WHERE email = ?";
  const [[usuario]] = await pool.query(sql, [email]);
  return usuario;
}

export async function buscarPorId(id) {
  const sql = "SELECT * FROM usuarios WHERE id = ?";
  const [[usuario]] = await pool.query(sql, [id]);
  return usuario;
}

export async function crear({ email, passwordHash, rol }) {
  const sql = "INSERT INTO usuarios (email, password_hash, rol) VALUES (?, ?, ?)";
  const [resultado] = await pool.query(sql, [email, passwordHash, rol]);
  return { id: resultado.insertId, email, rol };
}
