const Jugador = require('../models/jugador.model');
const { HttpError } = require('../errors');

exports.listar = (filtros) => Jugador.listar(filtros);

exports.obtener = (id) => {
  const jugador = Jugador.obtener(id);
  if (!jugador) throw new HttpError(404, 'Jugador no encontrado');
  return jugador;
};

exports.crear = (data) => {
  if (Jugador.obtenerPorNickname(data.nickname))
    throw new HttpError(409, 'El nickname ya existe');
  const { lastInsertRowid } = Jugador.crear(data);
  return Jugador.obtener(lastInsertRowid);
};

exports.actualizar = (id, data) => {
  exports.obtener(id); // lanza 404 si no existe
  const otro = Jugador.obtenerPorNickname(data.nickname);
  if (otro && otro.id !== id) throw new HttpError(409, 'El nickname ya existe');
  Jugador.actualizar(id, data);
  return Jugador.obtener(id);
};

exports.eliminar = (id) => {
  exports.obtener(id); // lanza 404 si no existe
  Jugador.eliminar(id);
};