// Crea el usuario admin con ADMIN_EMAIL y ADMIN_PASSWORD del .env.
// Si ya existe, actualiza su contraseña y le asegura el rol admin.
import "dotenv/config";
import bcrypt from "bcryptjs";
import pool from "../src/db.js";

const email = (process.env.ADMIN_EMAIL || "").toLowerCase();
const password = process.env.ADMIN_PASSWORD;
if (!email || !password) {
  console.error("Define ADMIN_EMAIL y ADMIN_PASSWORD en el .env");
  process.exit(1);
}

const passwordHash = await bcrypt.hash(password, 10);
const [resultado] = await pool.query(
  `INSERT INTO usuarios (email, password_hash, rol) VALUES (?, ?, 'admin')
   ON DUPLICATE KEY UPDATE password_hash = ?, rol = 'admin'`,
  [email, passwordHash, passwordHash],
);

// affectedRows: 1 = fila insertada, 2 = fila existente actualizada.
const accion = resultado.affectedRows === 1 ? "creado" : "actualizado";
console.log(`Admin ${accion}: ${email}`);
await pool.end();
