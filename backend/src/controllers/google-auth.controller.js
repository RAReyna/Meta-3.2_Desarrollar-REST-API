const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const Usuario = require("../models/usuario.model");

const MAX_AGE = Number(process.env.COOKIE_MAX_AGE) || 60 * 60 * 1000;
const COOKIE_BASE = {
  sameSite: "strict",
  secure: process.env.NODE_ENV === "production",
  path: "/",
};
// El state vuelve desde Google (navegación cross-site): Strict no se enviaría.
const STATE_COOKIE = {
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  path: "/api/v1/auth/google",
  maxAge: 10 * 60 * 1000,
};

const front = () => process.env.FRONTEND_URL || "http://localhost:5173";
const errorFront = (res, codigo) =>
  res.redirect(`${front()}/login?error=${codigo}`);

function login(req, res) {
  const state = crypto.randomBytes(32).toString("hex");
  res.cookie("oauth_state", state, STATE_COOKIE);
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID,
    redirect_uri: process.env.GOOGLE_REDIRECT_URI,
    response_type: "code",
    scope: "openid email profile",
    state,
    prompt: "select_account",
  });
  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
}

async function callback(req, res) {
  const { code, state, error } = req.query;
  const guardado = req.cookies?.oauth_state;
  res.clearCookie("oauth_state", { ...STATE_COOKIE, maxAge: undefined });

  if (error) return errorFront(res, "google_denegado");
  if (
    typeof state !== "string" ||
    typeof guardado !== "string" ||
    state.length !== guardado.length ||
    !crypto.timingSafeEqual(Buffer.from(state), Buffer.from(guardado))
  ) {
    return errorFront(res, "state_invalido");
  }
  if (typeof code !== "string") return errorFront(res, "sin_codigo");

  try {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: process.env.GOOGLE_REDIRECT_URI,
        grant_type: "authorization_code",
      }),
    });
    if (!tokenRes.ok) return errorFront(res, "token_fallido");
    const { access_token } = await tokenRes.json();

    const infoRes = await fetch(
      "https://openidconnect.googleapis.com/v1/userinfo",
      { headers: { Authorization: `Bearer ${access_token}` } },
    );
    if (!infoRes.ok) return errorFront(res, "perfil_fallido");
    const perfil = await infoRes.json();
    if (!perfil.sub || !perfil.email || !perfil.email_verified) {
      return errorFront(res, "email_no_verificado");
    }

    const email = perfil.email.toLowerCase();
    let usuario = await Usuario.findOne({ where: { google_id: perfil.sub } });
    if (!usuario) {
      usuario = await Usuario.findOne({ where: { email } });
      if (usuario) {
        usuario.google_id = perfil.sub;
        await usuario.save();
      } else {
        usuario = await Usuario.create({
          email,
          google_id: perfil.sub,
          password_hash: null,
          rol: "public",
        });
      }
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
    res.redirect(`${front()}/`);
  } catch (err) {
    console.error("Google OAuth:", err);
    errorFront(res, "error_interno");
  }
}

module.exports = { login, callback };
