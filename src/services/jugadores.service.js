const { Op } = require("sequelize");
const Jugador = require("../models/jugador.model");
const { HttpError } = require("../errors");

const buscar = async (id) => {
  const jugador = await Jugador.findByPk(id);
  if (!jugador) throw new HttpError(404, "Jugador no encontrado");
  return jugador;
};

exports.obtener = buscar;

exports.listar = ({ rol, estado, search }) => {
  const where = {};
  if (rol) where.rol = rol;
  if (estado) where.estado = estado;
  if (search) where.nickname = { [Op.like]: `%${search}%` };
  return Jugador.findAll({ where, order: [["id", "ASC"]] });
};

exports.crear = async (data) => {
  if (await Jugador.findOne({ where: { nickname: data.nickname } }))
    throw new HttpError(409, "El nickname ya existe");
  const creado = await Jugador.create(data);
  return Jugador.findByPk(creado.id); // relee para incluir los campos nulos
};

exports.actualizar = async (id, data) => {
  const jugador = await buscar(id);
  const otro = await Jugador.findOne({ where: { nickname: data.nickname } });
  if (otro && otro.id !== id) throw new HttpError(409, "El nickname ya existe");
  await jugador.update({
    nickname: data.nickname,
    nombre_real: data.nombre_real ?? null,
    pais: data.pais ?? null,
    rol: data.rol,
    estado: data.estado,
  });
  return jugador;
};

exports.eliminar = async (id) => {
  const jugador = await buscar(id);
  await jugador.destroy();
};
