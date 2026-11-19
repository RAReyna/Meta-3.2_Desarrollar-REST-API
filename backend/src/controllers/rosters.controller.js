const { z } = require("zod");
const service = require("../services/rosters.service");
const { TIPOS_ROSTER, ROLES_EN_ROSTER } = require("../constantes");
const { idValido } = require("../errors");

const rosterSchema = z.object({
  nombre: z.string().trim().min(1),
  juego: z.string().trim().min(1).default("League of Legends"),
  tipo: z.enum(TIPOS_ROSTER),
  temporada: z.string().trim().min(1),
});

const filtrosSchema = z.object({
  tipo: z.enum(TIPOS_ROSTER).optional(),
  temporada: z.string().optional(),
});

const asignacionSchema = z.object({
  id_jugador: z.number().int().positive(),
  rol_en_roster: z.enum(ROLES_EN_ROSTER),
});

const cambioRolSchema = z.object({ rol_en_roster: z.enum(ROLES_EN_ROSTER) });

exports.listar = async (req, res) =>
  res.json(await service.listar(filtrosSchema.parse(req.query)));

exports.obtener = async (req, res) =>
  res.json(await service.obtener(idValido(req.params.id)));

exports.crear = async (req, res) =>
  res.status(201).json(await service.crear(rosterSchema.parse(req.body)));

exports.actualizar = async (req, res) =>
  res.json(
    await service.actualizar(
      idValido(req.params.id),
      rosterSchema.parse(req.body),
    ),
  );

exports.eliminar = async (req, res) => {
  await service.eliminar(idValido(req.params.id));
  res.status(204).end();
};

// ---- Asignación ----

exports.listarJugadores = async (req, res) =>
  res.json(await service.listarJugadores(idValido(req.params.id)));

exports.asignar = async (req, res) =>
  res
    .status(201)
    .json(
      await service.asignar(
        idValido(req.params.id),
        asignacionSchema.parse(req.body),
      ),
    );

exports.cambiarRol = async (req, res) =>
  res.json(
    await service.cambiarRol(
      idValido(req.params.id),
      idValido(req.params.id_jugador),
      cambioRolSchema.parse(req.body).rol_en_roster,
    ),
  );

exports.quitar = async (req, res) => {
  await service.quitar(
    idValido(req.params.id),
    idValido(req.params.id_jugador),
  );
  res.status(204).end();
};
