import { fn, col } from "sequelize";
import {
  sequelize,
  Jugador,
  Roster,
  RosterJugador,
} from "../../models/index.js";
import { HttpError } from "../errors.js";

const MAX_TITULARES = 5;

// Las funciones auxiliares reciben `t`: la transacción de la que forman
// parte, o undefined cuando la consulta va suelta.

async function buscarRoster(id, t) {
  const roster = await Roster.findByPk(id, { transaction: t });
  if (!roster) throw new HttpError(404, "Roster no encontrado");
  return roster;
}

// Igual que buscarRoster, pero bloquea la fila (SELECT ... FOR UPDATE) hasta
// el fin de la transacción: otra petición sobre el mismo roster espera su turno.
async function bloquearRoster(id, t) {
  const roster = await Roster.findByPk(id, {
    transaction: t,
    lock: t.LOCK.UPDATE,
  });
  if (!roster) throw new HttpError(404, "Roster no encontrado");
  return roster;
}

async function buscarJugador(id, t) {
  const jugador = await Jugador.findByPk(id, { transaction: t });
  if (!jugador) throw new HttpError(404, "Jugador no encontrado");
  return jugador;
}

// Jugadores del roster a través de la tabla intermedia, en orden de asignación.
// Cada uno trae su fila intermedia en jugador.RosterJugador.
function jugadoresDe(roster, t, where) {
  return roster.getJugadores({
    where,
    attributes: ["id", "nickname", "rol"],
    joinTableAttributes: ["id", "rol_en_roster"],
    order: [[sequelize.col("RosterJugador.id"), "ASC"]],
    transaction: t,
  });
}

// Forma que responde el API: { id, nickname, rol, rol_en_roster }.
const aplanar = ({ id, nickname, rol, RosterJugador }) => ({
  id,
  nickname,
  rol,
  rol_en_roster: RosterJugador.rol_en_roster,
});

async function jugadorEnRoster(roster, idJugador, t) {
  const [jugador] = await jugadoresDe(roster, t, { id: idJugador });
  return jugador;
}

// RN-02: máximo 5 titulares. RN-03: dos titulares no pueden tener el mismo rol.
// El jugador que se valida no cuenta contra sí mismo (al cambiar su rol).
async function validarTitular(roster, jugador, t) {
  const titulares = (await jugadoresDe(roster, t)).filter(
    (j) => j.RosterJugador.rol_en_roster === "Titular" && j.id !== jugador.id,
  );
  if (titulares.length >= MAX_TITULARES) {
    throw new HttpError(409, "El roster ya tiene 5 titulares");
  }
  if (titulares.some((j) => j.rol === jugador.rol)) {
    throw new HttpError(409, `Ya hay un titular con el rol ${jugador.rol}`);
  }
}

// ---- Rosters ----

export async function listar({ tipo, temporada }) {
  const where = {};
  if (tipo) where.tipo = tipo;
  if (temporada) where.temporada = temporada;

  // LEFT JOIN con las asignaciones solo para contarlas.
  const rosters = await Roster.findAll({
    where,
    attributes: {
      include: [[fn("COUNT", col("asignaciones.id")), "cantidad_jugadores"]],
    },
    include: [{ model: RosterJugador, as: "asignaciones", attributes: [] }],
    group: ["Roster.id"],
    order: [["id", "ASC"]],
  });
  return rosters;
}

export async function obtener(id) {
  const roster = await buscarRoster(id);
  const jugadores = await jugadoresDe(roster);
  return { ...roster.toJSON(), jugadores: jugadores.map(aplanar) };
}

export function crear({ nombre, juego, tipo, temporada }) {
  return Roster.create({ nombre, juego, tipo, temporada });
}

export async function actualizar(id, { nombre, juego, tipo, temporada }) {
  const roster = await buscarRoster(id);
  return roster.update({ nombre, juego, tipo, temporada });
}

// El FK con ON DELETE CASCADE borra las asignaciones; los jugadores permanecen.
export async function eliminar(id) {
  const borrados = await Roster.destroy({ where: { id } });
  if (borrados === 0) throw new HttpError(404, "Roster no encontrado");
}

// ---- Asignación de jugadores ----

export async function listarJugadores(idRoster) {
  const roster = await buscarRoster(idRoster);
  return (await jugadoresDe(roster)).map(aplanar);
}

// asignar y cambiarRol corren en una transacción que bloquea el roster:
// dos peticiones simultáneas no pueden saltarse RN-02 ni RN-03.
// sequelize.transaction hace commit si la función termina y rollback si lanza.

export function asignar(idRoster, { id_jugador, rol_en_roster }) {
  return sequelize.transaction(async (t) => {
    const roster = await bloquearRoster(idRoster, t);
    const jugador = await buscarJugador(id_jugador, t);
    if (await roster.hasJugador(jugador, { transaction: t })) {
      throw new HttpError(409, "El jugador ya está en este roster");
    }
    if (rol_en_roster === "Titular") {
      await validarTitular(roster, jugador, t);
    }

    // Inserta la fila en roster_jugador con el rol en el roster.
    await roster.addJugador(jugador, {
      through: { rol_en_roster },
      transaction: t,
    });
    return aplanar(await jugadorEnRoster(roster, id_jugador, t));
  });
}

export function cambiarRol(idRoster, idJugador, rolEnRoster) {
  return sequelize.transaction(async (t) => {
    const roster = await bloquearRoster(idRoster, t);
    const jugador = await jugadorEnRoster(roster, idJugador, t);
    if (!jugador) {
      throw new HttpError(404, "El jugador no está en este roster");
    }
    if (rolEnRoster === "Titular") {
      await validarTitular(roster, jugador, t);
    }

    // jugador.RosterJugador es su fila de la tabla intermedia.
    await jugador.RosterJugador.update(
      { rol_en_roster: rolEnRoster },
      { transaction: t },
    );
    return aplanar(jugador);
  });
}

export async function quitar(idRoster, idJugador) {
  const roster = await buscarRoster(idRoster);
  // removeJugador borra la fila de roster_jugador y devuelve cuántas borró.
  const borrados = await roster.removeJugador(idJugador);
  if (borrados === 0) {
    throw new HttpError(404, "El jugador no está en este roster");
  }
}
