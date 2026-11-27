import { Op } from "sequelize";
import { Jugador } from "../../models/index.js";
import { HttpError } from "../errors.js";

export async function obtener(id) {
  const jugador = await Jugador.findByPk(id);
  if (!jugador) throw new HttpError(404, "Jugador no encontrado");
  return jugador;
}

export async function listar({ rol, estado, search }) {
  const where = {};
  if (rol) where.rol = rol;
  if (estado) where.estado = estado;
  if (search) where.nickname = { [Op.like]: `%${search}%` };

  return Jugador.findAll({ where, order: [["id", "ASC"]] });
}

async function validarNickname(nickname, idActual = 0) {
  const otro = await Jugador.findOne({
    where: { nickname, id: { [Op.ne]: idActual } },
    attributes: ["id"],
  });
  if (otro) throw new HttpError(409, "El nickname ya existe");
}

// Los campos opcionales que no llegan se guardan como null.
const camposDe = (datos) => ({
  nickname: datos.nickname,
  nombre_real: datos.nombre_real ?? null,
  pais: datos.pais ?? null,
  rol: datos.rol,
  estado: datos.estado,
});

export async function crear(datos) {
  await validarNickname(datos.nickname);
  const jugador = await Jugador.create(camposDe(datos));
  return obtener(jugador.id);
}

// PUT reemplaza todos los campos.
export async function actualizar(id, datos) {
  const jugador = await obtener(id);
  await validarNickname(datos.nickname, id);
  return jugador.update(camposDe(datos));
}

export async function eliminar(id) {
  const borrados = await Jugador.destroy({ where: { id } });
  if (borrados === 0) throw new HttpError(404, "Jugador no encontrado");
}
