import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import { HttpError } from "../errors.js";

// Compara dos textos en tiempo constante (no filtra información por la demora).
function iguales(a, b) {
  if (typeof a !== "string" || typeof b !== "string") return false;
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  return bufA.length === bufB.length && crypto.timingSafeEqual(bufA, bufB);
}

// Verifica el JWT de la cookie HttpOnly y deja el usuario en req.usuario.
export function autenticar(req, res, next) {
  const token = req.cookies.jwt_token;
  if (!token) throw new HttpError(401, "No autenticado");

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ["HS256"] });
  } catch {
    throw new HttpError(401, "Sesión inválida o expirada");
  }

  req.usuario = { id: Number(payload.sub), rol: payload.rol };
  req.csrfEnJwt = payload.csrf;
  next();
}

// Double submit: header == cookie legible == valor guardado dentro del JWT.
export function verificarCsrf(req, res, next) {
  const header = req.get("x-csrf-token");
  const cookie = req.cookies.csrf_token;
  if (!iguales(header, req.csrfEnJwt) || !iguales(header, cookie)) {
    throw new HttpError(403, "Token CSRF inválido");
  }
  next();
}

export function requerirAdmin(req, res, next) {
  if (req.usuario.rol !== "admin") {
    throw new HttpError(403, "Se requiere rol admin");
  }
  next();
}

const METODOS_DE_LECTURA = ["GET", "HEAD", "OPTIONS"];

// Envuelve un middleware para que solo se aplique a POST/PUT/DELETE.
const soloEscrituras = (middleware) => (req, res, next) =>
  METODOS_DE_LECTURA.includes(req.method) ? next() : middleware(req, res, next);

// Leer es público: cualquiera puede consultar jugadores y rosters sin cuenta.
// Escribir exige sesión, token CSRF y rol admin.
export const protegerEscrituras = [
  soloEscrituras(autenticar),
  soloEscrituras(verificarCsrf),
  soloEscrituras(requerirAdmin),
];
