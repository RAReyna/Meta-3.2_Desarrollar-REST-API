// Uso: con el servidor corriendo (npm run dev) → node endpoint-test.js
const BASE = process.env.API_URL || "http://localhost:3000/api/v1";
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

(async () => {
  let fallos = 0;
  for (const [metodo, ruta, esperado, body, guardar] of pasos) {
    const path = ruta.replace(/\$(\w+)/g, (_, k) => ids[k]);
    const res = await fetch(BASE + path, {
      method: metodo,
      headers: { "Content-Type": "application/json" },
      body:
        body && JSON.stringify(body).replace(/"\$(\w+)"/g, (_, k) => ids[k]),
    });
    const texto = await res.text();
    if (guardar && res.ok) ids[guardar] = JSON.parse(texto).id;
    const ok = res.status === esperado;
    if (!ok) fallos++;
    console.log(
      `${ok ? "Pass" : "Fail"} ${metodo.padEnd(6)} ${path.padEnd(42)} ${res.status} (esperado ${esperado})${ok ? "" : "  " + texto}`,
    );
  }
  console.log(`\n${pasos.length - fallos}/${pasos.length} pruebas pasaron`);
  process.exit(fallos ? 1 : 0);
})().catch((e) => {
  console.error("Error (¿está corriendo el servidor?):", e.message);
  process.exit(1);
});
