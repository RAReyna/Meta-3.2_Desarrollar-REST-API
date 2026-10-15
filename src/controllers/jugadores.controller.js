const { z } = require("zod");
const service = require("../services/jugadores.service");
const { ROLES, ESTADOS } = require("../constantes");
const { idValido } = require("../errors");

const jugadorSchema = z.object({
  nickname: z.string().trim().min(1),
  nombre_real: z.string().optional(),
  pais: z.string().optional(),
  rol: z.enum(ROLES),
  estado: z.enum(ESTADOS).default("activo"),
});

const filtrosSchema = z.object({
  rol: z.enum(ROLES).optional(),
  estado: z.enum(ESTADOS).optional(),
  search: z.string().optional(),
});

exports.listar = async (req, res) =>
  res.json(await service.listar(filtrosSchema.parse(req.query)));

exports.obtener = async (req, res) =>
  res.json(await service.obtener(idValido(req.params.id)));

exports.crear = async (req, res) =>
  res.status(201).json(await service.crear(jugadorSchema.parse(req.body)));

exports.actualizar = async (req, res) =>
  res.json(
    await service.actualizar(
      idValido(req.params.id),
      jugadorSchema.parse(req.body),
    ),
  );

exports.eliminar = async (req, res) => {
  await service.eliminar(idValido(req.params.id));
  res.status(204).end();
};
