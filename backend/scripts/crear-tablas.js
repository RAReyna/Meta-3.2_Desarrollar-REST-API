// Crea las tablas de db/schema.sql (las que ya existen no se tocan).
import "dotenv/config";
import { readFile } from "node:fs/promises";
import mysql from "mysql2/promise";
import { config } from "../src/db.js";

const schema = await readFile(
  new URL("../db/schema.sql", import.meta.url),
  "utf8",
);

// multipleStatements: el archivo tiene varias sentencias.
const conexion = await mysql.createConnection({
  ...config,
  multipleStatements: true,
});
await conexion.query(schema);
await conexion.end();

console.log("Tablas listas: jugadores, rosters, roster_jugador, usuarios");
