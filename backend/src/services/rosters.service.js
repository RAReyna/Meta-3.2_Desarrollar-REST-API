const { Op, fn, col } = require("sequelize");
const { Roster, RosterJugador } = require("../models/roster.model");
const Jugador = require("../models/jugador.model");
const { HttpError } = require("../errors");

const incluirJugador = [{ model: Jugador, as: "jugador" }];

const aEntrada = (fila) => ({
  id: fila.jugador.id,
  nickname: fila.jugador.nickname,
  rol: fila.jugador.rol,
  rol_en_roster: fila.rol_en_roster,
});

const buscar = async (id) => {
  const roster = await Roster.findByPk(id);
  if (!roster) throw new HttpError(404, "Roster no encontrado");
  return roster;
};

const buscarAsignacion = async (idRoster, idJugador) => {
  const fila = await RosterJugador.findOne({
    where: { id_roster: idRoster, id_jugador: idJugador },
  });
  if (!fila) throw new HttpError(404, "El jugador no está en este roster");
  return fila;
};

const jugadoresDe = async (idRoster) => {
  const filas = await RosterJugador.findAll({
    where: { id_roster: idRoster },
    include: incluirJugador,
    order: [["id", "ASC"]],
  });
  return filas.map(aEntrada);
};

const entradaDe = async (idRoster, idJugador) => {
  const fila = await RosterJugador.findOne({
    where: { id_roster: idRoster, id_jugador: idJugador },
    include: incluirJugador,
  });
  return aEntrada(fila);
};

// RN-02 (máx. 5 titulares) y RN-03 (no repetir rol entre titulares)
const validarTitular = async (idRoster, jugador, excluirIdJugador = 0) => {
  const titulares = await RosterJugador.findAll({
    where: {
      id_roster: idRoster,
      rol_en_roster: "Titular",
      id_jugador: { [Op.ne]: excluirIdJugador },
    },
    include: incluirJugador,
  });
  if (titulares.length >= 5)
    throw new HttpError(409, "El roster ya tiene 5 titulares");
  if (titulares.some((t) => t.jugador.rol === jugador.rol))
    throw new HttpError(409, `Ya hay un titular con el rol ${jugador.rol}`);
};

// ---- Rosters ----

exports.listar = async ({ tipo, temporada }) => {
  const where = {};
  if (tipo) where.tipo = tipo;
  if (temporada) where.temporada = temporada;

  const rosters = await Roster.findAll({ where, order: [["id", "ASC"]] });
  const conteos = await RosterJugador.findAll({
    attributes: ["id_roster", [fn("COUNT", col("id")), "total"]],
    group: ["id_roster"],
    raw: true,
  });
  const porRoster = Object.fromEntries(
    conteos.map((c) => [c.id_roster, Number(c.total)]),
  );

  return rosters.map((r) => ({
    ...r.get({ plain: true }),
    cantidad_jugadores: porRoster[r.id] || 0,
  }));
};

exports.obtener = async (id) => {
  const roster = await buscar(id);
  return { ...roster.get({ plain: true }), jugadores: await jugadoresDe(id) };
};

exports.crear = (data) => Roster.create(data);

exports.actualizar = async (id, data) => {
  const roster = await buscar(id);
  await roster.update(data);
  return roster;
};

exports.eliminar = async (id) => {
  const roster = await buscar(id);
  await roster.destroy(); // el FK con CASCADE borra solo las asignaciones, no los jugadores
};

// ---- Asignación ----

exports.listarJugadores = async (idRoster) => {
  await buscar(idRoster);
  return jugadoresDe(idRoster);
};

exports.asignar = async (idRoster, { id_jugador, rol_en_roster }) => {
  await buscar(idRoster);
  const jugador = await Jugador.findByPk(id_jugador);
  if (!jugador) throw new HttpError(404, "Jugador no encontrado");
  if (
    await RosterJugador.findOne({ where: { id_roster: idRoster, id_jugador } })
  )
    throw new HttpError(409, "El jugador ya está en este roster");
  if (rol_en_roster === "Titular") await validarTitular(idRoster, jugador);
  await RosterJugador.create({
    id_roster: idRoster,
    id_jugador,
    rol_en_roster,
  });
  return entradaDe(idRoster, id_jugador);
};

exports.cambiarRol = async (idRoster, idJugador, rolEnRoster) => {
  await buscar(idRoster);
  const fila = await buscarAsignacion(idRoster, idJugador);
  if (rolEnRoster === "Titular") {
    const jugador = await Jugador.findByPk(idJugador);
    await validarTitular(idRoster, jugador, idJugador);
  }
  await fila.update({ rol_en_roster: rolEnRoster });
  return entradaDe(idRoster, idJugador);
};

exports.quitar = async (idRoster, idJugador) => {
  await buscar(idRoster);
  const fila = await buscarAsignacion(idRoster, idJugador);
  await fila.destroy();
};
