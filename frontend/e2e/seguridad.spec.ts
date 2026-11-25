import { expect, test, type APIRequestContext } from "@playwright/test";
import {
  S,
  crearPublic,
  limpiar,
  loginAdmin,
  logout,
  sesionApi,
  type SesionApi,
} from "./helpers.ts";

// La mayoría de estas pruebas atacan el API directamente, como lo haría
// alguien fuera del navegador. El fixture `request` empieza sin cookies,
// así que el header Cookie se arma a mano para controlar qué llega.

const API = "/api/v1";
let admin: SesionApi;
let pub: SesionApi;

test.beforeAll(async () => {
  admin = await sesionApi();
  const cuenta = await crearPublic("seguridad");
  pub = await sesionApi(cuenta.email, cuenta.password);
});

test.afterAll(async () => {
  await limpiar(admin); // por si algún ataque llegó a crear algo
  await admin.cerrar();
  await pub.cerrar();
});

async function cookiesDe(ses: SesionApi) {
  const { cookies } = await ses.ctx.storageState();
  const valor = (n: string) => cookies.find((c) => c.name === n)!.value;
  return { jwt: valor("jwt_token"), csrf: valor("csrf_token") };
}

const cookie = (jwt: string, csrf: string) => `jwt_token=${jwt}; csrf_token=${csrf}`;

// POST /jugadores con cookies y header CSRF elegidos a mano.
function crearJugador(
  request: APIRequestContext,
  nickname: string,
  c: { jwt: string; csrfCookie: string; csrfHeader: string },
) {
  return request.post(`${API}/jugadores`, {
    data: { nickname, rol: "Top" },
    headers: {
      Cookie: cookie(c.jwt, c.csrfCookie),
      "x-csrf-token": c.csrfHeader,
    },
  });
}

async function noExiste(nickname: string) {
  expect(await admin.get(`/jugadores?search=${nickname}`)).toHaveLength(0);
}

test("S1 jwt_token es HttpOnly y SameSite=Strict", async ({ page }) => {
  await loginAdmin(page);
  const cookies = await page.context().cookies();
  const jwt = cookies.find((c) => c.name === "jwt_token");
  const csrf = cookies.find((c) => c.name === "csrf_token");

  expect(jwt?.httpOnly).toBe(true);
  expect(jwt?.sameSite).toBe("Strict");
  expect(csrf?.httpOnly).toBe(false); // el frontend la lee para el header
  expect(csrf?.sameSite).toBe("Strict");

  // Un script en la página ve el token CSRF, pero no el JWT.
  // Se pasa como texto: se ejecuta en el navegador, no en Node.
  const visibles: string = await page.evaluate("document.cookie");
  expect(visibles).toContain("csrf_token=");
  expect(visibles).not.toContain("jwt_token");
});

test("S2 POST sin header CSRF → 403", async () => {
  const nick = `S2${S}`;
  const r = await admin.ctx.post(`${API}/jugadores`, {
    data: { nickname: nick, rol: "Top" },
  });
  expect(r.status()).toBe(403);
  expect((await r.json()).error).toBe("Token CSRF inválido");
  await noExiste(nick);
});

test("S3 POST con header CSRF incorrecto → 403", async () => {
  const nick = `S3${S}`;
  const r = await admin.ctx.post(`${API}/jugadores`, {
    data: { nickname: nick, rol: "Top" },
    headers: { "x-csrf-token": "f".repeat(64) },
  });
  expect(r.status()).toBe(403);
  await noExiste(nick);
});

test("S4 cuenta public con CSRF válido no puede escribir → 403", async () => {
  const nick = `S4${S}`;
  const headers = { "x-csrf-token": pub.csrf };

  const post = await pub.ctx.post(`${API}/jugadores`, {
    data: { nickname: nick, rol: "Top" },
    headers,
  });
  expect(post.status()).toBe(403);
  expect((await post.json()).error).toBe("Se requiere rol admin");

  const del = await pub.ctx.delete(`${API}/rosters/1`, { headers });
  expect(del.status()).toBe(403);
  await noExiste(nick);
});

test("S5 sin sesión: se puede leer pero no escribir (health sigue abierto)", async ({
  request,
}) => {
  // Consultar jugadores y rosters es público; escribir exige sesión.
  expect((await request.get(`${API}/jugadores`)).status()).toBe(200);
  expect((await request.get(`${API}/rosters`)).status()).toBe(200);
  const post = await request.post(`${API}/jugadores`, {
    data: { nickname: `S5${S}`, rol: "Top" },
  });
  expect(post.status()).toBe(401);
  expect((await request.get(`${API}/auth/me`)).status()).toBe(401);
  expect((await request.get(`${API}/health`)).status()).toBe(200);
  await noExiste(`S5${S}`);
});

test("S6 JWT manipulado → 401", async ({ request }) => {
  const { jwt, csrf } = await cookiesDe(pub);
  const me = (token: string) =>
    request.get(`${API}/auth/me`, { headers: { Cookie: cookie(token, csrf) } });

  // Control positivo: el token sin tocar funciona.
  expect((await me(jwt)).status()).toBe(200);

  // Firma alterada. Se cambia el primer carácter de la firma: el último
  // lleva bits de relleno en base64url y cambiarlo podría no alterar nada.
  const [h, p, firma] = jwt.split(".");
  const otra = (firma[0] === "A" ? "B" : "A") + firma.slice(1);
  expect((await me(`${h}.${p}.${otra}`)).status()).toBe(401);

  // Escalada: public → admin en el payload, conservando la firma original.
  const payload = JSON.parse(Buffer.from(p, "base64url").toString());
  expect(payload.rol).toBe("public");
  payload.rol = "admin";
  const falso = `${h}.${Buffer.from(JSON.stringify(payload)).toString("base64url")}.${firma}`;

  const nick = `S6${S}`;
  const r = await crearJugador(request, nick, {
    jwt: falso,
    csrfCookie: csrf,
    csrfHeader: csrf,
  });
  expect(r.status()).toBe(401);
  expect((await r.json()).error).toBe("Sesión inválida o expirada");
  await noExiste(nick);
});

test("S7 token CSRF de otra sesión → 403", async ({ request }) => {
  const otra = await sesionApi(); // segunda sesión del admin
  const a = await cookiesDe(admin);
  const b = await cookiesDe(otra);
  await otra.cerrar();

  // Control positivo: JWT, cookie y header de la misma sesión → 201.
  const ok = await crearJugador(request, `S7ok${S}`, {
    jwt: a.jwt,
    csrfCookie: a.csrf,
    csrfHeader: a.csrf,
  });
  expect(ok.status()).toBe(201);

  // Header de B con la sesión de A.
  const nick = `S7${S}`;
  const r1 = await crearJugador(request, nick, {
    jwt: a.jwt,
    csrfCookie: a.csrf,
    csrfHeader: b.csrf,
  });
  expect(r1.status()).toBe(403);

  // Cookie y header de B coinciden entre sí, pero no con el CSRF dentro del JWT de A.
  const r2 = await crearJugador(request, nick, {
    jwt: a.jwt,
    csrfCookie: b.csrf,
    csrfHeader: b.csrf,
  });
  expect(r2.status()).toBe(403);
  await noExiste(nick);
});

test("S8 logout borra las cookies y exige CSRF", async ({ page }) => {
  // Un sitio externo no puede cerrar la sesión: logout también exige CSRF.
  const sinCsrf = await admin.ctx.post(`${API}/auth/logout`);
  expect(sinCsrf.status()).toBe(403);

  await loginAdmin(page);
  await logout(page);

  const nombres = (await page.context().cookies()).map((c) => c.name);
  expect(nombres).not.toContain("jwt_token");
  expect(nombres).not.toContain("csrf_token");

  expect((await page.request.get(`${API}/auth/me`)).status()).toBe(401);
  await page.reload();
  await expect(page.getByTestId("btn-cuenta")).toBeVisible();
});
