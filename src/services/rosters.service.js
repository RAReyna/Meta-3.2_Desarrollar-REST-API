const Roster = require('../models/roster.model');
const Jugador = require('../models/jugador.model');
const { HttpError } = require('../errors');

const buscar = (id) => {
  const roster = Roster.obtener(id);
  if (!roster) throw new HttpError(404, 'Roster no encontrado');
  return roster;
};

// RN-02 (máx. 5 titulares) y RN-03 (no repetir rol entre titulares)
const validarTitular = (idRoster, jugador, excluirIdJugador = 0) => {
  const titulares = Roster.titularesDe(idRoster, excluirIdJugador);
  if (titulares.length >= 5)
    throw new HttpError(409, 'El roster ya tiene 5 titulares');
  if (titulares.some((t) => t.rol === jugador.rol))
    throw new HttpError(409, `Ya hay un titular con el rol ${jugador.rol}`);
};

const entradaDe = (idRoster, idJugador) =>
  Roster.jugadoresDe(idRoster).find((j) => j.id === idJugador);

exports.listar = (filtros) => Roster.listar(filtros);

exports.obtener = (id) => ({ ...buscar(id), jugadores: Roster.jugadoresDe(id) });

exports.crear = (data) => {
  const { lastInsertRowid } = Roster.crear(data);
  return Roster.obtener(lastInsertRowid);
};

exports.actualizar = (id, data) => {
  buscar(id);
  Roster.actualizar(id, data);
  return Roster.obtener(id);
};

exports.eliminar = (id) => {
  buscar(id);
  Roster.eliminar(id); // CASCADE borra solo las asignaciones, no los jugadores
};

// ---- Asignación ----

exports.listarJugadores = (idRoster) => {
  buscar(idRoster);
  return Roster.jugadoresDe(idRoster);
};

exports.asignar = (idRoster, { id_jugador, rol_en_roster }) => {
  buscar(idRoster);
  const jugador = Jugador.obtener(id_jugador);
  if (!jugador) throw new HttpError(404, 'Jugador no encontrado');
  if (Roster.obtenerAsignacion(idRoster, id_jugador))
    throw new HttpError(409, 'El jugador ya está en este roster');
  if (rol_en_roster === 'Titular') validarTitular(idRoster, jugador);
  Roster.asignar(idRoster, id_jugador, rol_en_roster);
  return entradaDe(idRoster, id_jugador);
};

exports.cambiarRol = (idRoster, idJugador, rolEnRoster) => {
  buscar(idRoster);
  if (!Roster.obtenerAsignacion(idRoster, idJugador))
    throw new HttpError(404, 'El jugador no está en este roster');
  if (rolEnRoster === 'Titular')
    validarTitular(idRoster, Jugador.obtener(idJugador), idJugador);
  Roster.cambiarRol(idRoster, idJugador, rolEnRoster);
  return entradaDe(idRoster, idJugador);
};

exports.quitar = (idRoster, idJugador) => {
  buscar(idRoster);
  if (!Roster.obtenerAsignacion(idRoster, idJugador))
    throw new HttpError(404, 'El jugador no está en este roster');
  Roster.quitar(idRoster, idJugador);
};