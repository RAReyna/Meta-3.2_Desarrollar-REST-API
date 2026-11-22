import { z } from "zod";
import * as service from "../services/rosters.service.js";
import { TIPOS_ROSTER, ROLES_EN_ROSTER } from "../constantes.js";
import { idValido } from "../errors.js";

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

// ---- Rosters ----

export async function listar(req, res) {
  res.json(await service.listar(filtrosSchema.parse(req.query)));
}

export async function obtener(req, res) {
  res.json(await service.obtener(idValido(req.params.id)));
}

export async function crear(req, res) {
  const datos = rosterSchema.parse(req.body);
  res.status(201).json(await service.crear(datos));
}

export async function actualizar(req, res) {
  const id = idValido(req.params.id);
  const datos = rosterSchema.parse(req.body);
  res.json(await service.actualizar(id, datos));
}

export async function eliminar(req, res) {
  await service.eliminar(idValido(req.params.id));
  res.status(204).end();
}

// ---- Asignación de jugadores ----

export async function listarJugadores(req, res) {
  res.json(await service.listarJugadores(idValido(req.params.id)));
}

export async function asignar(req, res) {
  const idRoster = idValido(req.params.id);
  const datos = asignacionSchema.parse(req.body);
  res.status(201).json(await service.asignar(idRoster, datos));
}

export async function cambiarRol(req, res) {
  const idRoster = idValido(req.params.id);
  const idJugador = idValido(req.params.id_jugador);
  const { rol_en_roster } = cambioRolSchema.parse(req.body);
  res.json(await service.cambiarRol(idRoster, idJugador, rol_en_roster));
}

export async function quitar(req, res) {
  const idRoster = idValido(req.params.id);
  const idJugador = idValido(req.params.id_jugador);
  await service.quitar(idRoster, idJugador);
  res.status(204).end();
}
