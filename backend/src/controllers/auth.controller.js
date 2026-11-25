import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import * as usuarios from "../services/usuarios.service.js";
import { HttpError } from "../errors.js";

const DURACION_MS = Number(process.env.COOKIE_MAX_AGE) || 60 * 60 * 1000;

const COOKIE = {
  sameSite: "strict",
  secure: process.env.NODE_ENV === "production",
  path: "/",
};

// Hash falso: si el email no existe, bcrypt tarda lo mismo
// y el tiempo de respuesta no revela qué emails están registrados.
const HASH_FALSO = bcrypt.hashSync("contrasena-falsa", 10);

const loginSchema = z.object({
  email: z.email().toLowerCase(),
  password: z.string().min(1),
});

// bcrypt solo usa los primeros 72 bytes de la contraseña.
const registroSchema = z.object({
  email: z.email().max(255).toLowerCase(),
  password: z.string().min(8).max(72),
});

const datosPublicos = (usuario) => ({
  id: usuario.id,
  email: usuario.email,
  rol: usuario.rol,
});

// Firma el JWT, guarda las dos cookies y responde con el usuario.
function abrirSesion(res, usuario, status) {
  const csrf = crypto.randomBytes(32).toString("hex");
  const token = jwt.sign({ rol: usuario.rol, csrf }, process.env.JWT_SECRET, {
    algorithm: "HS256",
    subject: String(usuario.id),
    expiresIn: Math.floor(DURACION_MS / 1000),
  });

  // Cookies que el navegador guarda y envía de vuelta en cada petición.
  res.cookie("jwt_token", token, { ...COOKIE, httpOnly: true, maxAge: DURACION_MS });
  res.cookie("csrf_token", csrf, { ...COOKIE, httpOnly: false, maxAge: DURACION_MS });
  res.status(status).json({ usuario: datosPublicos(usuario), csrfToken: csrf });
}

export async function login(req, res) {
  const { email, password } = loginSchema.parse(req.body);

  const usuario = await usuarios.buscarPorEmail(email);
  const correcta = await bcrypt.compare(password, usuario?.password_hash ?? HASH_FALSO);
  if (!usuario || !correcta) {
    throw new HttpError(401, "Credenciales inválidas");
  }
  abrirSesion(res, usuario, 200);
}

// Registro abierto: toda cuenta nueva es "public" (solo lectura).
// El rol nunca se toma del body, así nadie puede registrarse como admin.
export async function registro(req, res) {
  const { email, password } = registroSchema.parse(req.body);

  if (await usuarios.buscarPorEmail(email)) {
    throw new HttpError(409, "El email ya está registrado");
  }
  const passwordHash = await bcrypt.hash(password, 10);
  const usuario = await usuarios.crear({ email, passwordHash, rol: "public" });
  abrirSesion(res, usuario, 201);
}

export function logout(req, res) {
  res.clearCookie("jwt_token", COOKIE);
  res.clearCookie("csrf_token", COOKIE);
  res.status(204).end();
}

export async function me(req, res) {
  const usuario = await usuarios.buscarPorId(req.usuario.id);
  if (!usuario) throw new HttpError(401, "No autenticado");
  res.json({ usuario: datosPublicos(usuario), csrfToken: req.csrfEnJwt });
}
