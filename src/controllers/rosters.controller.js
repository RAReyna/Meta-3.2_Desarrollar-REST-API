const { z } = require('zod');
const service = require('../services/rosters.service');
const { TIPOS_ROSTER, ROLES_EN_ROSTER } = require('../constantes');

const rosterSchema = z.object({
  nombre: z.string().trim().min(1),
  juego: z.string().trim().min(1).default('League of Legends'),
  tipo: z.enum(TIPOS_ROSTER),
  temporada: z.string().trim().min(1),
});

const filtrosSchema = z.object({
  tipo: z.enum(TIPOS_ROSTER).optional(),
  temporada: z.string().optional(),
});

const idDe = (req) => Number(req.params.id);

exports.listar = (req, res) =>
  res.json(service.listar(filtrosSchema.parse(req.query)));

exports.obtener = (req, res) => res.json(service.obtener(idDe(req)));

exports.crear = (req, res) =>
  res.status(201).json(service.crear(rosterSchema.parse(req.body)));

exports.actualizar = (req, res) =>
  res.json(service.actualizar(idDe(req), rosterSchema.parse(req.body)));

exports.eliminar = (req, res) => {
  service.eliminar(idDe(req));
  res.status(204).end();
};
const asignacionSchema = z.object({
  id_jugador: z.number().int().positive(),
  rol_en_roster: z.enum(ROLES_EN_ROSTER),
});

const cambioRolSchema = z.object({ rol_en_roster: z.enum(ROLES_EN_ROSTER) });

const idJugadorDe = (req) => Number(req.params.id_jugador);

exports.listarJugadores = (req, res) =>
  res.json(service.listarJugadores(idDe(req)));

exports.asignar = (req, res) =>
  res.status(201).json(service.asignar(idDe(req), asignacionSchema.parse(req.body)));

exports.cambiarRol = (req, res) =>
  res.json(service.cambiarRol(idDe(req), idJugadorDe(req), cambioRolSchema.parse(req.body).rol_en_roster));

exports.quitar = (req, res) => {
  service.quitar(idDe(req), idJugadorDe(req));
  res.status(204).end();
};