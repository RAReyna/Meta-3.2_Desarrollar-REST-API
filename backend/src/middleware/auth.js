const crypto = require("crypto");
const jwt = require("jsonwebtoken");

const METODOS_SEGUROS = new Set(["GET", "HEAD", "OPTIONS"]);

function iguales(a, b) {
  if (typeof a !== "string" || typeof b !== "string") return false;
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  return bufA.length === bufB.length && crypto.timingSafeEqual(bufA, bufB);
}

// Verifica el JWT de la cookie HttpOnly.
function autenticar(req, res, next) {
  const token = req.cookies?.jwt_token;
  if (!token) return res.status(401).json({ error: "No autenticado" });

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ["HS256"],
    });
  } catch {
    return res.status(401).json({ error: "Sesión inválida o expirada" });
  }

  req.usuario = { id: Number(payload.sub), rol: payload.rol };
  req.csrfEnJwt = payload.csrf;
  next();
}

// Double submit: header == cookie legible == claim dentro del JWT.
function verificarCsrf(req, res, next) {
  const header = req.get("x-csrf-token");
  const cookie = req.cookies?.csrf_token;
  if (!iguales(header, req.csrfEnJwt) || !iguales(header, cookie)) {
    return res.status(403).json({ error: "Token CSRF inválido" });
  }
  next();
}

function requerirAdmin(req, res, next) {
  if (req.usuario?.rol !== "admin") {
    return res.status(403).json({ error: "Se requiere rol admin" });
  }
  next();
}

// Aplica un middleware solo a métodos que modifican datos.
const soloEscrituras = (mw) => (req, res, next) =>
  METODOS_SEGUROS.has(req.method) ? next() : mw(req, res, next);

// Toda petición exige sesión (admin o public). Además, POST/PUT/DELETE
// exigen token CSRF y rol admin: el rol public solo puede leer.
const protegerApi = [
  autenticar,
  soloEscrituras(verificarCsrf),
  soloEscrituras(requerirAdmin),
];

module.exports = {
  autenticar,
  verificarCsrf,
  requerirAdmin,
  protegerApi,
};
