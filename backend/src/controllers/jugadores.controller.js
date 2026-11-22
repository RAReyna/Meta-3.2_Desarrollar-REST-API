import { z } from "zod";
import * as service from "../services/jugadores.service.js";
import { ROLES, ESTADOS } from "../constantes.js";
import { idValido } from "../errors.js";

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

export async function listar(req, res) {
  res.json(await service.listar(filtrosSchema.parse(req.query)));
}

export async function obtener(req, res) {
  res.json(await service.obtener(idValido(req.params.id)));
}

export async function crear(req, res) {
  const datos = jugadorSchema.parse(req.body);
  res.status(201).json(await service.crear(datos));
}

export async function actualizar(req, res) {
  const id = idValido(req.params.id);
  const datos = jugadorSchema.parse(req.body);
  res.json(await service.actualizar(id, datos));
}

export async function eliminar(req, res) {
  await service.eliminar(idValido(req.params.id));
  res.status(204).end();
}
