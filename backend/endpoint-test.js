// Uso: con el servidor corriendo (npm run dev) → node endpoint-test.js
// Requiere el usuario admin (npm run seed:admin).
require("dotenv").config();

const BASE = process.env.API_URL || "http://localhost:3000/api/v1";
const EMAIL = process.env.ADMIN_EMAIL || "admin@example.com";
const PASSWORD = process.env.ADMIN_PASSWORD || "Admin12345";
const S = Date.now().toString().slice(-6); // sufijo único para poder repetir la prueba
const ids = {}; // ids guardados; "$top" se sustituye por su id

const roles = {
  top: "Top",
  jungle: "Jungle",
  mid: "Mid",
  adc: "ADC",
  support: "Support",
  mid2: "Mid",
};
const roster = (nombre, tipo) => ({
  nombre: `${nombre} ${S}`,
  tipo,
  temporada: S,
});
const asignar = (r, j, rol, esp) => [
  "POST",
  `/rosters/$${r}/jugadores`,
  esp,
  { id_jugador: `$${j}`, rol_en_roster: rol },
];
const cambiar = (r, j, rol, esp) => [
  "PUT",
  `/rosters/$${r}/jugadores/$${j}`,
  esp,
  { rol_en_roster: rol },
];

// [método, ruta, código esperado, body, guardar id como]
const pasos = [
  ["GET", "/health", 200],
  ["GET", "/roles", 200],
  ["GET", "/estados", 200],
  ["GET", "/tipos-roster", 200],
  // Jugadores
  ...Object.entries(roles).map(([k, rol]) => [
    "POST",
    "/jugadores",
    201,
    { nickname: k + S, rol },
    k,
  ]),
  ["POST", "/jugadores", 409, { nickname: "top" + S, rol: "Top" }], // RN-01
  ["POST", "/jugadores", 400, { nickname: "x" + S, rol: "Mago" }],
  ["GET", `/jugadores?rol=Mid&estado=activo&search=${S}`, 200],
  ["GET", "/jugadores/$top", 200],
  ["GET", "/jugadores/999999", 404],
  [
    "PUT",
    "/jugadores/$top",
    200,
    { nickname: "top" + S, rol: "Top", estado: "inactivo" },
  ],
  // Rosters
  ["POST", "/rosters", 201, roster("A", "Principal"), "A"],
  ["POST", "/rosters", 201, roster("B", "Academy"), "B"],
  ["POST", "/rosters", 400, { nombre: "", tipo: "Otro" }],
  ["GET", `/rosters?temporada=${S}`, 200],
  ["GET", "/rosters/$A", 200],
  ["GET", "/rosters/999999", 404],
  ["PUT", "/rosters/$A", 200, roster("A editado", "Principal")],
  // Asignación
  ...["top", "jungle", "mid", "adc", "support"].map((j) =>
    asignar("A", j, "Titular", 201),
  ),
  asignar("A", "mid2", "Titular", 409), // RN-02: 6.º titular
  asignar("A", "top", "Suplente", 409), // ya asignado
  [
    "POST",
    "/rosters/999999/jugadores",
    404,
    { id_jugador: "$top", rol_en_roster: "Titular" },
  ],
  [
    "POST",
    "/rosters/$A/jugadores",
    404,
    { id_jugador: 999999, rol_en_roster: "Titular" },
  ],
  asignar("A", "mid2", "Capitán", 400),
  asignar("B", "mid", "Titular", 201),
  asignar("B", "mid2", "Titular", 409), // RN-03: mismo rol
  asignar("B", "mid2", "Suplente", 201),
  cambiar("B", "mid2", "Titular", 409),
  cambiar("B", "mid", "Suplente", 200),
  cambiar("B", "mid2", "Titular", 200),
  ["GET", "/rosters/$A/jugadores", 200],
  ["DELETE", "/rosters/$A/jugadores/$support", 204],
  ["DELETE", "/rosters/$A/jugadores/$support", 404],
  // Eliminación y limpieza
  ["DELETE", "/rosters/$A", 204],
  ["GET", "/jugadores/$top", 200], // RN-05: el jugador permanece
  ["DELETE", "/rosters/$B", 204],
  ...Object.keys(roles).map((k) => ["DELETE", `/jugadores/$${k}`, 204]),
];

// Petición con cookie y token CSRF opcionales.
async function pedir(metodo, ruta, { body, cookie, csrf } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (cookie) headers.Cookie = cookie;
  if (csrf) headers["x-csrf-token"] = csrf;
  const res = await fetch(BASE + ruta, {
    method: metodo,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const texto = await res.text();
  return { res, status: res.status, texto };
}

// Login: devuelve la cookie lista para reenviar y el token CSRF.
async function iniciarSesion(email, password) {
  const r = await pedir("POST", "/auth/login", { body: { email, password } });
  if (r.status !== 200) return { ...r, cookie: "", csrf: "" };
  const cookie = r.res.headers
    .getSetCookie()
    .map((c) => c.split(";")[0])
    .join("; ");
  return { ...r, cookie, csrf: JSON.parse(r.texto).csrfToken };
}

(async () => {
  let total = 0;
  let fallos = 0;
  const registrar = (ok, etiqueta, detalle = "") => {
    total++;
    if (!ok) fallos++;
    console.log(`${ok ? "Pass" : "Fail"} ${etiqueta}${ok ? "" : "  " + detalle}`);
  };
  const linea = (metodo, ruta, status, esperado) =>
    `${metodo.padEnd(6)} ${ruta.padEnd(42)} ${status} (esperado ${esperado})`;

  // ── Sesión de admin para las pruebas funcionales ──
  const admin = await iniciarSesion(EMAIL, PASSWORD);
  registrar(
    admin.status === 200,
    linea("POST", "/auth/login (admin)", admin.status, 200),
    admin.texto,
  );
  if (admin.status !== 200) {
    console.error("\nNo se pudo iniciar sesión. Revisa ADMIN_EMAIL/ADMIN_PASSWORD y corre npm run seed:admin.");
    process.exit(1);
  }

  // ── Pruebas funcionales (con sesión de admin) ──
  for (const [metodo, ruta, esperado, body, guardar] of pasos) {
    const path = ruta.replace(/\$(\w+)/g, (_, k) => ids[k]);
    const cuerpo = body && JSON.parse(JSON.stringify(body).replace(/"\$(\w+)"/g, (_, k) => ids[k]));
    const r = await pedir(metodo, path, {
      body: cuerpo,
      cookie: admin.cookie,
      csrf: admin.csrf,
    });
    if (guardar && r.res.ok) ids[guardar] = JSON.parse(r.texto).id;
    registrar(
      r.status === esperado,
      linea(metodo, path, r.status, esperado),
      r.texto,
    );
  }

  // ── Pruebas de seguridad ──
  const caso = async (metodo, ruta, esperado, opciones) => {
    const r = await pedir(metodo, ruta, opciones);
    registrar(
      r.status === esperado,
      linea(metodo, ruta + (opciones?.nota ? ` [${opciones.nota}]` : ""), r.status, esperado),
      r.texto,
    );
    return r;
  };
  const nuevo = { nickname: "seg" + S, rol: "Top" };

  await caso("POST", "/auth/login", 401, {
    body: { email: EMAIL, password: "incorrecta" },
    nota: "contraseña incorrecta",
  });
  await caso("POST", "/auth/login", 401, {
    body: { email: "nadie@example.com", password: "x" },
    nota: "email inexistente",
  });
  await caso("POST", "/auth/login", 400, {
    body: { email: "no-es-email" },
    nota: "datos inválidos",
  });
  await caso("GET", "/jugadores", 401, { nota: "sin sesión" });
  await caso("GET", "/rosters", 401, { nota: "sin sesión" });
  await caso("POST", "/jugadores", 401, { body: nuevo, nota: "sin sesión" });
  await caso("DELETE", "/jugadores/999999", 401, { nota: "sin sesión" });
  await caso("POST", "/jugadores", 403, {
    body: nuevo,
    cookie: admin.cookie,
    nota: "sin token CSRF",
  });
  await caso("POST", "/jugadores", 403, {
    body: nuevo,
    cookie: admin.cookie,
    csrf: "token-incorrecto",
    nota: "CSRF incorrecto",
  });
  await caso("GET", "/auth/me", 200, { cookie: admin.cookie, nota: "con sesión" });
  await caso("GET", "/auth/me", 401, { nota: "sin sesión" });

  // ── Registro y rol public (solo lectura) ──
  const emailPublic = `public${S}@example.com`;
  const reg = await caso("POST", "/auth/registro", 201, {
    body: { email: emailPublic, password: "Public12345" },
    nota: "cuenta nueva",
  });
  registrar(
    reg.status === 201 && JSON.parse(reg.texto).usuario.rol === "public",
    "POST   /auth/registro [la cuenta nueva tiene rol public]",
    reg.texto,
  );
  await caso("POST", "/auth/registro", 409, {
    body: { email: emailPublic.toUpperCase(), password: "Public12345" },
    nota: "email duplicado",
  });
  await caso("POST", "/auth/registro", 400, {
    body: { email: "no-es-email", password: "corta" },
    nota: "datos inválidos",
  });
  const regAdmin = await caso("POST", "/auth/registro", 201, {
    body: { email: `rol${S}@example.com`, password: "Public12345", rol: "admin" },
    nota: "intenta rol admin",
  });
  registrar(
    regAdmin.status === 201 && JSON.parse(regAdmin.texto).usuario.rol === "public",
    "POST   /auth/registro [ignora el rol enviado en el body]",
    regAdmin.texto,
  );

  const pub = await iniciarSesion(emailPublic, "Public12345");
  registrar(
    pub.status === 200,
    linea("POST", "/auth/login (public)", pub.status, 200),
    pub.texto,
  );
  await caso("GET", "/jugadores", 200, { cookie: pub.cookie, nota: "public" });
  await caso("GET", "/rosters", 200, { cookie: pub.cookie, nota: "public" });
  await caso("POST", "/jugadores", 403, {
    body: nuevo,
    cookie: pub.cookie,
    csrf: pub.csrf,
    nota: "public con CSRF válido",
  });
  await caso("DELETE", "/rosters/999999", 403, {
    cookie: pub.cookie,
    csrf: pub.csrf,
    nota: "public",
  });

  const salida = await caso("POST", "/auth/logout", 204, {
    cookie: admin.cookie,
    csrf: admin.csrf,
  });
  const limpia = salida.res.headers
    .getSetCookie()
    .some((c) => c.startsWith("jwt_token=;"));
  registrar(limpia, "POST   /auth/logout [limpia la cookie jwt_token]");

  console.log(`\n${total - fallos}/${total} pruebas pasaron`);
  process.exit(fallos ? 1 : 0);
})().catch((e) => {
  console.error("Error (¿está corriendo el servidor?):", e.message);
  process.exit(1);
});
