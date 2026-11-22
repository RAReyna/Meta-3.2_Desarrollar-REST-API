// Pruebas de los endpoints. Uso: con el servidor corriendo → npm test
// Requiere el usuario admin (npm run seed:admin).
import "dotenv/config";

const BASE = process.env.API_URL || "http://localhost:3000/api/v1";
const EMAIL = process.env.ADMIN_EMAIL;
const PASSWORD = process.env.ADMIN_PASSWORD;

// Sufijo único: los datos de prueba no chocan con corridas anteriores.
const S = Date.now().toString().slice(-6);

// ---- Utilidades ----

let pasaron = 0;
let fallaron = 0;

function registrar(ok, descripcion, detalle = "") {
  if (ok) pasaron++;
  else fallaron++;
  console.log(`${ok ? "Pass" : "Fail"} ${descripcion}${ok ? "" : "  " + detalle}`);
}

// Cliente HTTP. Con una sesión, envía su cookie y su token CSRF.
function cliente(sesion = {}) {
  async function pedir(metodo, ruta, body) {
    const headers = { "Content-Type": "application/json" };
    if (sesion.cookie) headers.Cookie = sesion.cookie;
    if (sesion.csrf) headers["x-csrf-token"] = sesion.csrf;

    const res = await fetch(BASE + ruta, {
      method: metodo,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const texto = await res.text();
    return {
      metodo,
      ruta,
      status: res.status,
      texto,
      datos: texto ? JSON.parse(texto) : null,
      cookies: res.headers.getSetCookie(),
    };
  }

  return {
    get: (ruta) => pedir("GET", ruta),
    post: (ruta, body) => pedir("POST", ruta, body),
    put: (ruta, body) => pedir("PUT", ruta, body),
    del: (ruta) => pedir("DELETE", ruta),
  };
}

// Espera la respuesta, comprueba su código de estado y devuelve su body.
async function espera(esperado, peticion, nota = "") {
  const r = await peticion;
  const etiqueta = `${r.metodo.padEnd(6)} ${(r.ruta + (nota && ` [${nota}]`)).padEnd(46)}`;
  registrar(r.status === esperado, `${etiqueta} ${r.status} (esperado ${esperado})`, r.texto);
  return r.datos;
}

// Inicia sesión y devuelve la sesión: { cookie, csrf }.
async function iniciarSesion(email, password, nota) {
  const r = await cliente().post("/auth/login", { email, password });
  await espera(200, r, nota);
  const cookie = r.cookies.map((c) => c.split(";")[0]).join("; ");
  return { cookie, csrf: r.datos?.csrfToken };
}

// ---- Pruebas ----

const anonimo = cliente();

try {
  await anonimo.get("/health");
} catch (e) {
  console.error("No se pudo conectar (¿está corriendo el servidor?):", e.message);
  process.exit(1);
}

const sesionAdmin = await iniciarSesion(EMAIL, PASSWORD, "admin");
if (!sesionAdmin.csrf) {
  console.error("\nNo se pudo iniciar sesión. Revisa ADMIN_EMAIL/ADMIN_PASSWORD y corre npm run seed:admin.");
  process.exit(1);
}
const admin = cliente(sesionAdmin);

// Auxiliares
await espera(200, anonimo.get("/health"));
await espera(200, anonimo.get("/roles"));
await espera(200, anonimo.get("/estados"));
await espera(200, anonimo.get("/tipos-roster"));

// Jugadores
const roles = {
  top: "Top",
  jungle: "Jungle",
  mid: "Mid",
  adc: "ADC",
  support: "Support",
  mid2: "Mid",
  support2: "Support",
};
const jugador = {}; // nombre → id
for (const [nombre, rol] of Object.entries(roles)) {
  const creado = await espera(201, admin.post("/jugadores", { nickname: nombre + S, rol }));
  jugador[nombre] = creado?.id;
}
await espera(409, admin.post("/jugadores", { nickname: "top" + S, rol: "Top" }), "RN-01 nickname duplicado");
await espera(400, admin.post("/jugadores", { nickname: "x" + S, rol: "Mago" }), "rol inválido");
await espera(200, admin.get(`/jugadores?rol=Mid&estado=activo&search=${S}`));
await espera(200, admin.get(`/jugadores/${jugador.top}`));
await espera(404, admin.get("/jugadores/999999"));
await espera(200, admin.put(`/jugadores/${jugador.top}`, { nickname: "top" + S, rol: "Top", estado: "inactivo" }));

// Rosters
const nuevoRoster = (nombre, tipo) => ({ nombre: `${nombre} ${S}`, tipo, temporada: S });
const A = (await espera(201, admin.post("/rosters", nuevoRoster("A", "Principal"))))?.id;
const B = (await espera(201, admin.post("/rosters", nuevoRoster("B", "Academy"))))?.id;
await espera(400, admin.post("/rosters", { nombre: "", tipo: "Otro" }), "datos inválidos");
await espera(200, admin.get(`/rosters?temporada=${S}`));
await espera(200, admin.get(`/rosters/${A}`));
await espera(404, admin.get("/rosters/999999"));
await espera(200, admin.put(`/rosters/${A}`, nuevoRoster("A editado", "Principal")));

// Asignación de jugadores
const asignar = (roster, nombre, rol_en_roster) =>
  admin.post(`/rosters/${roster}/jugadores`, { id_jugador: jugador[nombre], rol_en_roster });
const cambiarRol = (roster, nombre, rol_en_roster) =>
  admin.put(`/rosters/${roster}/jugadores/${jugador[nombre]}`, { rol_en_roster });

for (const nombre of ["top", "jungle", "mid", "adc", "support"]) {
  await espera(201, asignar(A, nombre, "Titular"));
}
await espera(409, asignar(A, "mid2", "Titular"), "RN-02 sexto titular");
await espera(409, asignar(A, "top", "Suplente"), "ya asignado");
await espera(404, admin.post("/rosters/999999/jugadores", { id_jugador: jugador.top, rol_en_roster: "Titular" }));
await espera(404, admin.post(`/rosters/${A}/jugadores`, { id_jugador: 999999, rol_en_roster: "Titular" }), "jugador inexistente");
await espera(400, asignar(A, "mid2", "Capitán"), "rol_en_roster inválido");
await espera(201, asignar(B, "mid", "Titular"));
await espera(409, asignar(B, "mid2", "Titular"), "RN-03 rol repetido");
await espera(201, asignar(B, "mid2", "Suplente"));
await espera(409, cambiarRol(B, "mid2", "Titular"), "RN-03 rol repetido");
await espera(200, cambiarRol(B, "mid", "Suplente"));
await espera(200, cambiarRol(B, "mid2", "Titular"));
await espera(200, admin.get(`/rosters/${A}/jugadores`));
await espera(204, admin.del(`/rosters/${A}/jugadores/${jugador.support}`));
await espera(404, admin.del(`/rosters/${A}/jugadores/${jugador.support}`), "ya no está");

// Concurrencia: dos titulares a la vez en un roster que ya tiene 4.
// Sin la transacción, ambos pasarían la validación y el roster tendría 6.
const C = (await espera(201, admin.post("/rosters", nuevoRoster("C", "Principal"))))?.id;
for (const nombre of ["top", "jungle", "mid", "adc"]) {
  await espera(201, asignar(C, nombre, "Titular"));
}
const simultaneas = await Promise.all([
  asignar(C, "support", "Titular"),
  asignar(C, "support2", "Titular"),
]);
const codigos = simultaneas.map((r) => r.status).sort().join(",");
registrar(
  codigos === "201,409",
  `POST   /rosters/${C}/jugadores [2 titulares simultáneos] ${codigos} (esperado 201,409)`,
);

// Eliminación y limpieza
await espera(204, admin.del(`/rosters/${A}`));
await espera(200, admin.get(`/jugadores/${jugador.top}`), "RN-05 el jugador permanece");
await espera(204, admin.del(`/rosters/${B}`));
await espera(204, admin.del(`/rosters/${C}`));
for (const id of Object.values(jugador)) {
  await espera(204, admin.del(`/jugadores/${id}`));
}

// Seguridad
const nuevo = { nickname: "seg" + S, rol: "Top" };
const sinCsrf = cliente({ cookie: sesionAdmin.cookie });
const csrfFalso = cliente({ cookie: sesionAdmin.cookie, csrf: "token-incorrecto" });

await espera(401, anonimo.post("/auth/login", { email: EMAIL, password: "incorrecta" }), "contraseña incorrecta");
await espera(401, anonimo.post("/auth/login", { email: "nadie@example.com", password: "x" }), "email inexistente");
await espera(400, anonimo.post("/auth/login", { email: "no-es-email" }), "datos inválidos");
await espera(200, anonimo.get("/jugadores"), "sin sesión: leer es público");
await espera(200, anonimo.get("/rosters"), "sin sesión: leer es público");
await espera(401, anonimo.post("/jugadores", nuevo), "sin sesión");
await espera(401, anonimo.del("/jugadores/999999"), "sin sesión");
await espera(403, sinCsrf.post("/jugadores", nuevo), "sin token CSRF");
await espera(403, csrfFalso.post("/jugadores", nuevo), "CSRF incorrecto");
await espera(200, admin.get("/auth/me"), "con sesión");
await espera(401, anonimo.get("/auth/me"), "sin sesión");

// Registro y rol public (solo lectura)
const emailPublic = `public${S}@example.com`;
const registrado = await espera(201, anonimo.post("/auth/registro", { email: emailPublic, password: "Public12345" }), "cuenta nueva");
registrar(registrado?.usuario.rol === "public", "POST   /auth/registro [la cuenta nueva tiene rol public]");
await espera(409, anonimo.post("/auth/registro", { email: emailPublic.toUpperCase(), password: "Public12345" }), "email duplicado");
await espera(400, anonimo.post("/auth/registro", { email: "no-es-email", password: "corta" }), "datos inválidos");
const conRol = await espera(201, anonimo.post("/auth/registro", { email: `rol${S}@example.com`, password: "Public12345", rol: "admin" }), "intenta rol admin");
registrar(conRol?.usuario.rol === "public", "POST   /auth/registro [ignora el rol enviado en el body]");

const publico = cliente(await iniciarSesion(emailPublic, "Public12345", "public"));
await espera(200, publico.get("/jugadores"), "public");
await espera(200, publico.get("/rosters"), "public");
await espera(403, publico.post("/jugadores", nuevo), "public con CSRF válido");
await espera(403, publico.del("/rosters/999999"), "public");

// Logout
const salida = await admin.post("/auth/logout");
await espera(204, salida);
registrar(
  salida.cookies.some((c) => c.startsWith("jwt_token=;")),
  "POST   /auth/logout [limpia la cookie jwt_token]",
);

console.log(`\n${pasaron}/${pasaron + fallaron} pruebas pasaron`);
process.exitCode = fallaron ? 1 : 0;
