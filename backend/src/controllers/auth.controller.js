const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { z } = require("zod");
const Usuario = require("../models/usuario.model");

const MAX_AGE = Number(process.env.COOKIE_MAX_AGE) || 60 * 60 * 1000;
const COOKIE_BASE = {
  sameSite: "strict",
  secure: process.env.NODE_ENV === "production",
  path: "/",
};

// Hash falso para que el tiempo de respuesta no revele si el email existe.
const HASH_FALSO = bcrypt.hashSync("contrasena-falsa", 10);

const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

async function login(req, res) {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res
      .status(400)
      .json({ error: "Datos inválidos", detalles: parsed.error.issues });
  }
  const { email, password } = parsed.data;

  const usuario = await Usuario.findOne({
    where: { email: email.toLowerCase() },
  });
  const ok = await bcrypt.compare(
    password,
    usuario ? usuario.password_hash : HASH_FALSO,
  );
  if (!usuario || !ok) {
    return res.status(401).json({ error: "Credenciales inválidas" });
  }

  const csrf = crypto.randomBytes(32).toString("hex");
  const token = jwt.sign({ rol: usuario.rol, csrf }, process.env.JWT_SECRET, {
    algorithm: "HS256",
    subject: String(usuario.id),
    expiresIn: Math.floor(MAX_AGE / 1000),
  });

  res.cookie("jwt_token", token, {
    ...COOKIE_BASE,
    httpOnly: true,
    maxAge: MAX_AGE,
  });
  res.cookie("csrf_token", csrf, {
    ...COOKIE_BASE,
    httpOnly: false,
    maxAge: MAX_AGE,
  });
  res.json({
    usuario: { id: usuario.id, email: usuario.email, rol: usuario.rol },
    csrfToken: csrf,
  });
}

function logout(req, res) {
  res.clearCookie("jwt_token", COOKIE_BASE);
  res.clearCookie("csrf_token", COOKIE_BASE);
  res.status(204).end();
}

async function me(req, res) {
  const usuario = await Usuario.findByPk(req.usuario.id);
  if (!usuario) return res.status(401).json({ error: "No autenticado" });
  res.json({
    usuario: { id: usuario.id, email: usuario.email, rol: usuario.rol },
    csrfToken: req.csrfEnJwt,
  });
}

module.exports = { login, logout, me };
