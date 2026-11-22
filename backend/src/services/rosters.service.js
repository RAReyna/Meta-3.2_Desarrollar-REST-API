import pool, { enTransaccion, armarWhere } from "../db.js";
import { HttpError } from "../errors.js";

const MAX_TITULARES = 5;

// Las funciones auxiliares reciben `db`: el pool, o la conexión de una
// transacción cuando la consulta tiene que formar parte de ella.

async function buscarRoster(db, id) {
  const sql = "SELECT * FROM rosters WHERE id = ?";
  const [[roster]] = await db.query(sql, [id]);
  if (!roster) throw new HttpError(404, "Roster no encontrado");
  return roster;
}

// Igual que buscarRoster, pero bloquea la fila hasta el fin de la transacción:
// otra petición sobre el mismo roster espera su turno.
async function bloquearRoster(db, id) {
  const sql = "SELECT id FROM rosters WHERE id = ? FOR UPDATE";
  const [[roster]] = await db.query(sql, [id]);
  if (!roster) throw new HttpError(404, "Roster no encontrado");
}

async function buscarJugador(db, id) {
  const sql = "SELECT * FROM jugadores WHERE id = ?";
  const [[jugador]] = await db.query(sql, [id]);
  if (!jugador) throw new HttpError(404, "Jugador no encontrado");
  return jugador;
}

async function estaAsignado(db, idRoster, idJugador) {
  const sql = "SELECT id FROM roster_jugador WHERE id_roster = ? AND id_jugador = ?";
  const [[asignacion]] = await db.query(sql, [idRoster, idJugador]);
  return Boolean(asignacion);
}

// Jugadores del roster, cada uno con su rol en él.
const SELECT_JUGADORES = `
  SELECT j.id, j.nickname, j.rol, rj.rol_en_roster
  FROM roster_jugador rj
  JOIN jugadores j ON j.id = rj.id_jugador`;

async function jugadoresDe(db, idRoster) {
  const sql = `${SELECT_JUGADORES} WHERE rj.id_roster = ? ORDER BY rj.id`;
  const [jugadores] = await db.query(sql, [idRoster]);
  return jugadores;
}

async function jugadorEnRoster(db, idRoster, idJugador) {
  const sql = `${SELECT_JUGADORES} WHERE rj.id_roster = ? AND rj.id_jugador = ?`;
  const [[jugador]] = await db.query(sql, [idRoster, idJugador]);
  return jugador;
}

// RN-02: máximo 5 titulares. RN-03: dos titulares no pueden tener el mismo rol.
// El jugador que se valida no cuenta contra sí mismo (al cambiar su rol).
async function validarTitular(db, idRoster, jugador) {
  const titulares = (await jugadoresDe(db, idRoster)).filter(
    (j) => j.rol_en_roster === "Titular" && j.id !== jugador.id,
  );
  if (titulares.length >= MAX_TITULARES) {
    throw new HttpError(409, "El roster ya tiene 5 titulares");
  }
  if (titulares.some((t) => t.rol === jugador.rol)) {
    throw new HttpError(409, `Ya hay un titular con el rol ${jugador.rol}`);
  }
}

// ---- Rosters ----

export async function listar({ tipo, temporada }) {
  const filtros = [];
  if (tipo) filtros.push(["r.tipo = ?", tipo]);
  if (temporada) filtros.push(["r.temporada = ?", temporada]);

  const { where, valores } = armarWhere(filtros);
  const sql = `
    SELECT r.*, COUNT(rj.id) AS cantidad_jugadores
    FROM rosters r
    LEFT JOIN roster_jugador rj ON rj.id_roster = r.id
    ${where}
    GROUP BY r.id
    ORDER BY r.id`;
  const [rosters] = await pool.query(sql, valores);
  return rosters;
}

export async function obtener(id) {
  const roster = await buscarRoster(pool, id);
  return { ...roster, jugadores: await jugadoresDe(pool, id) };
}

export async function crear({ nombre, juego, tipo, temporada }) {
  const sql = "INSERT INTO rosters (nombre, juego, tipo, temporada) VALUES (?, ?, ?, ?)";
  const [resultado] = await pool.query(sql, [nombre, juego, tipo, temporada]);
  return buscarRoster(pool, resultado.insertId);
}

export async function actualizar(id, { nombre, juego, tipo, temporada }) {
  await buscarRoster(pool, id);
  const sql = "UPDATE rosters SET nombre = ?, juego = ?, tipo = ?, temporada = ? WHERE id = ?";
  await pool.query(sql, [nombre, juego, tipo, temporada, id]);
  return buscarRoster(pool, id);
}

// El FK con ON DELETE CASCADE borra las asignaciones; los jugadores permanecen.
export async function eliminar(id) {
  const sql = "DELETE FROM rosters WHERE id = ?";
  const [resultado] = await pool.query(sql, [id]);
  if (resultado.affectedRows === 0) {
    throw new HttpError(404, "Roster no encontrado");
  }
}

// ---- Asignación de jugadores ----

export async function listarJugadores(idRoster) {
  await buscarRoster(pool, idRoster);
  return jugadoresDe(pool, idRoster);
}

// asignar y cambiarRol corren en una transacción que bloquea el roster:
// dos peticiones simultáneas no pueden saltarse RN-02 ni RN-03.

export function asignar(idRoster, { id_jugador, rol_en_roster }) {
  return enTransaccion(async (db) => {
    await bloquearRoster(db, idRoster);
    const jugador = await buscarJugador(db, id_jugador);
    if (await estaAsignado(db, idRoster, id_jugador)) {
      throw new HttpError(409, "El jugador ya está en este roster");
    }
    if (rol_en_roster === "Titular") {
      await validarTitular(db, idRoster, jugador);
    }

    const sql = "INSERT INTO roster_jugador (id_roster, id_jugador, rol_en_roster) VALUES (?, ?, ?)";
    await db.query(sql, [idRoster, id_jugador, rol_en_roster]);
    return jugadorEnRoster(db, idRoster, id_jugador);
  });
}

export function cambiarRol(idRoster, idJugador, rolEnRoster) {
  return enTransaccion(async (db) => {
    await bloquearRoster(db, idRoster);
    if (!(await estaAsignado(db, idRoster, idJugador))) {
      throw new HttpError(404, "El jugador no está en este roster");
    }
    if (rolEnRoster === "Titular") {
      await validarTitular(db, idRoster, await buscarJugador(db, idJugador));
    }

    const sql = "UPDATE roster_jugador SET rol_en_roster = ? WHERE id_roster = ? AND id_jugador = ?";
    await db.query(sql, [rolEnRoster, idRoster, idJugador]);
    return jugadorEnRoster(db, idRoster, idJugador);
  });
}

export async function quitar(idRoster, idJugador) {
  await buscarRoster(pool, idRoster);
  const sql = "DELETE FROM roster_jugador WHERE id_roster = ? AND id_jugador = ?";
  const [resultado] = await pool.query(sql, [idRoster, idJugador]);
  if (resultado.affectedRows === 0) {
    throw new HttpError(404, "El jugador no está en este roster");
  }
}
