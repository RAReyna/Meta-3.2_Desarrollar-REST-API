const { z } = require('zod');
const service = require('../services/jugadores.service');
const { ROLES, ESTADOS } = require('../constantes');

const jugadorSchema = z.object({
  nickname: z.string().trim().min(1),
  nombre_real: z.string().optional(),
  pais: z.string().optional(),
  rol: z.enum(ROLES),
  estado: z.enum(ESTADOS).default('activo'),
});

const filtrosSchema = z.object({
  rol: z.enum(ROLES).optional(),
  estado: z.enum(ESTADOS).optional(),
  search: z.string().optional(),
});

const idDe = (req) => Number(req.params.id);

exports.listar = (req, res) =>
  res.json(service.listar(filtrosSchema.parse(req.query)));

exports.obtener = (req, res) => res.json(service.obtener(idDe(req)));

exports.crear = (req, res) =>
  res.status(201).json(service.crear(jugadorSchema.parse(req.body)));

exports.actualizar = (req, res) =>
  res.json(service.actualizar(idDe(req), jugadorSchema.parse(req.body)));

exports.eliminar = (req, res) => {
  service.eliminar(idDe(req));
  res.status(204).end();
};