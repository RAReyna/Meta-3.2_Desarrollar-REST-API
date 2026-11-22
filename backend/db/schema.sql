-- Esquema de la base de datos. Se puede ejecutar varias veces:
-- solo crea las tablas que no existen (npm run db:init).

CREATE TABLE IF NOT EXISTS jugadores (
  id          INT          NOT NULL AUTO_INCREMENT PRIMARY KEY,
  nickname    VARCHAR(255) NOT NULL UNIQUE,
  nombre_real VARCHAR(255) NULL,
  pais        VARCHAR(255) NULL,
  rol         ENUM('Top', 'Jungle', 'Mid', 'ADC', 'Support') NOT NULL,
  estado      ENUM('activo', 'inactivo') NOT NULL DEFAULT 'activo'
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS rosters (
  id        INT          NOT NULL AUTO_INCREMENT PRIMARY KEY,
  nombre    VARCHAR(255) NOT NULL,
  juego     VARCHAR(255) NOT NULL DEFAULT 'League of Legends',
  tipo      ENUM('Principal', 'Academy') NOT NULL,
  temporada VARCHAR(255) NOT NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Jugadores asignados a cada roster. Al borrar un roster o un jugador
-- se borran sus asignaciones, nunca el otro lado.
CREATE TABLE IF NOT EXISTS roster_jugador (
  id            INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  id_roster     INT NOT NULL,
  id_jugador    INT NOT NULL,
  rol_en_roster ENUM('Titular', 'Suplente') NOT NULL,
  CONSTRAINT roster_jugador_unico UNIQUE (id_roster, id_jugador),
  FOREIGN KEY (id_roster)  REFERENCES rosters (id)   ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (id_jugador) REFERENCES jugadores (id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS usuarios (
  id            INT          NOT NULL AUTO_INCREMENT PRIMARY KEY,
  email         VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  rol           ENUM('admin', 'public') NOT NULL DEFAULT 'public'
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
