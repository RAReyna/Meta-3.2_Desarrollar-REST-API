const Database = require('better-sqlite3');
const db = new Database('roster.db');
db.pragma('foreign_keys = ON');

db.exec(`
CREATE TABLE IF NOT EXISTS jugadores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nickname TEXT NOT NULL UNIQUE,
  nombre_real TEXT,
  pais TEXT,
  rol TEXT NOT NULL CHECK (rol IN ('Top','Jungle','Mid','ADC','Support')),
  estado TEXT NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo','inactivo'))
);
CREATE TABLE IF NOT EXISTS rosters (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  juego TEXT NOT NULL DEFAULT 'League of Legends',
  tipo TEXT NOT NULL CHECK (tipo IN ('Principal','Academy')),
  temporada TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS roster_jugador (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  id_roster INTEGER NOT NULL REFERENCES rosters(id) ON DELETE CASCADE,
  id_jugador INTEGER NOT NULL REFERENCES jugadores(id) ON DELETE CASCADE,
  rol_en_roster TEXT NOT NULL CHECK (rol_en_roster IN ('Titular','Suplente')),
  UNIQUE (id_roster, id_jugador)
);`);

module.exports = db;