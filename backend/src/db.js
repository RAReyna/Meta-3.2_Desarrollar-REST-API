import mysql from "mysql2/promise";

export const config = {
  host: process.env.DB_HOST || "127.0.0.1",
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  charset: "utf8mb4_unicode_ci",
};

// Un solo pool de conexiones para toda la aplicación.
const pool = mysql.createPool(config);
export default pool;

// Ejecuta fn(conexion) dentro de una transacción:
// commit si termina bien, rollback si lanza un error.
export async function enTransaccion(fn) {
  const conexion = await pool.getConnection();
  try {
    await conexion.beginTransaction();
    const resultado = await fn(conexion);
    await conexion.commit();
    return resultado;
  } catch (err) {
    await conexion.rollback();
    throw err;
  } finally {
    conexion.release();
  }
}

// Arma la cláusula WHERE a partir de pares [condición, valor].
// Ejemplo: armarWhere([["rol = ?", "Mid"]]) → { where: "WHERE rol = ?", valores: ["Mid"] }
export function armarWhere(filtros) {
  if (filtros.length === 0) return { where: "", valores: [] };
  return {
    where: "WHERE " + filtros.map(([condicion]) => condicion).join(" AND "),
    valores: filtros.map(([, valor]) => valor),
  };
}
