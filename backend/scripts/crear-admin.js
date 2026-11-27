// Crea el usuario admin con ADMIN_EMAIL y ADMIN_PASSWORD del .env.
// Si ya existe, actualiza su contraseña y le asegura el rol admin.
import "dotenv/config";
import bcrypt from "bcryptjs";
import { sequelize, Usuario } from "../models/index.js";

const email = (process.env.ADMIN_EMAIL || "").toLowerCase();
const password = process.env.ADMIN_PASSWORD;
if (!email || !password) {
  console.error("Define ADMIN_EMAIL y ADMIN_PASSWORD en el .env");
  process.exit(1);
}

const datos = { password_hash: await bcrypt.hash(password, 10), rol: "admin" };
const existente = await Usuario.findOne({ where: { email } });
if (existente) {
  await existente.update(datos);
} else {
  await Usuario.create({ email, ...datos });
}

console.log(`Admin ${existente ? "actualizado" : "creado"}: ${email}`);
await sequelize.close();
