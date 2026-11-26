import { expect, test } from "@playwright/test";
import { S, crearPublic, elegir, filas, limpiar, loginUI, logout, sesionApi } from "./helpers.js";

let api;
let cuenta;
let principal;

// Datos de prueba preparados por el admin; temporada = S para filtrarlos.
test.beforeAll(async () => {
  api = await sesionApi();
  cuenta = await crearPublic("lector");

  const top = await api.post("/jugadores", { nickname: `P3top${S}`, rol: "Top" });
  const mid = await api.post("/jugadores", { nickname: `P3mid${S}`, rol: "Mid" });
  principal = await api.post("/rosters", {
    nombre: `P Principal ${S}`,
    tipo: "Principal",
    temporada: S,
  });
  await api.post("/rosters", { nombre: `P Academy ${S}`, tipo: "Academy", temporada: S });
  await api.post(`/rosters/${principal.id}/jugadores`, {
    id_jugador: top.id,
    rol_en_roster: "Titular",
  });
  await api.post(`/rosters/${principal.id}/jugadores`, {
    id_jugador: mid.id,
    rol_en_roster: "Suplente",
  });
});

test.afterAll(async () => {
  await limpiar(api);
  await api.cerrar();
});

// Controles que solo ve el admin.
const CONTROLES_ADMIN = ["nuevo-jugador", "nuevo-roster", "asignar-jugador", "asignar-submit"];

// Revisa jugadores, rosters y un detalle: cargan los datos y no hay controles de edición.
async function soloLectura(page) {
  const paginas = [
    ["/jugadores", "tabla-jugadores"],
    ["/rosters", "tabla-rosters"],
    [`/rosters/${principal.id}`, "titulares"],
  ];
  for (const [ruta, contenido] of paginas) {
    await page.goto(ruta);
    await expect(page.getByTestId(contenido)).toBeVisible();
    for (const id of CONTROLES_ADMIN) {
      await expect(page.getByTestId(id), `${ruta}: ${id}`).toHaveCount(0);
    }
    await expect(page.getByRole("button", { name: /^(Editar|Eliminar|Quitar) / })).toHaveCount(0);
  }
}

test("P1 registro de cuenta", async ({ page }) => {
  const email = `e2e-${S}-registro@example.com`;
  await page.goto("/login");
  await page.getByTestId("link-registro").click();
  await expect(page).toHaveURL("/registro");

  await page.getByTestId("registro-email").locator("input").fill(email);
  await page.getByTestId("registro-password").locator("input").fill("Public12345");
  await page.getByTestId("registro-submit").click();
  await expect(page).toHaveURL("/");
  await page.getByTestId("menu-cuenta").click();
  await expect(page.getByTestId("usuario-email")).toContainText(email);
  await expect(page.getByTestId("usuario-email")).toContainText("Solo lectura");

  // El mismo email otra vez → error de duplicado
  await page.getByTestId("btn-logout").click();
  await page.goto("/registro");
  await page.getByTestId("registro-email").locator("input").fill(email);
  await page.getByTestId("registro-password").locator("input").fill("Public12345");
  await page.getByTestId("registro-submit").click();
  await expect(page.getByTestId("registro-error")).toContainText("Ese email ya está registrado");
});

test("P2 sin cuenta: portada y consulta en solo lectura", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("btn-cuenta")).toBeVisible();
  await page.getByTestId("inicio-rosters").click();
  await expect(page).toHaveURL("/rosters");
  await page.goto("/");
  await page.getByTestId("inicio-jugadores").click();
  await expect(page).toHaveURL("/jugadores");

  await soloLectura(page);
});

test("P3 jugadores: búsqueda y filtros", async ({ page }) => {
  await page.goto("/jugadores");
  const lista = filas(page, "tabla-jugadores");

  await page.getByLabel("Buscar por nickname", { exact: true }).fill(S);
  await expect(lista).toHaveCount(2);

  await elegir(page, "Rol", "Mid");
  await expect(lista).toHaveCount(1);
  await expect(lista).toContainText(`P3mid${S}`);

  // Los dos son activos: con "inactivo" no queda ninguno
  await elegir(page, "Estado", "inactivo");
  await expect(lista).toHaveCount(0);
  await expect(page.getByText("No hay jugadores que coincidan")).toBeVisible();
});

test("P4 rosters: filtros y detalle", async ({ page }) => {
  await page.goto("/rosters");
  const lista = filas(page, "tabla-rosters");

  await elegir(page, "Temporada", S);
  await expect(lista).toHaveCount(2);
  await elegir(page, "Tipo", "Principal");
  await expect(lista).toHaveCount(1);

  // Clic en la fila → detalle
  await lista.filter({ hasText: `P Principal ${S}` }).click();
  await expect(page).toHaveURL(`/rosters/${principal.id}`);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(`P Principal ${S}`);
  await expect(page.getByTestId("titulares").getByTestId("jugador-en-roster")).toHaveText([
    `TopP3top${S}`,
  ]);
  await expect(page.getByTestId("suplentes").getByTestId("jugador-en-roster")).toHaveText([
    `MidP3mid${S}`,
  ]);

  // Las migas regresan a la lista
  await page.getByRole("link", { name: "Rosters" }).last().click();
  await expect(page).toHaveURL("/rosters");

  await page.goto("/rosters/999999");
  await expect(page.getByRole("alert")).toContainText("Roster no encontrado");
});

test("P5 cuenta public: solo lectura", async ({ page }) => {
  await loginUI(page, cuenta.email, cuenta.password);
  await soloLectura(page);
  await logout(page);
});

test("P6 rutas: desconocidas → portada; con sesión no hay login ni registro", async ({ page }) => {
  await page.goto("/no-existe");
  await expect(page).toHaveURL("/");
  await page.goto("/admin/jugadores");
  await expect(page).toHaveURL("/");

  await loginUI(page, cuenta.email, cuenta.password);
  for (const ruta of ["/login", "/registro"]) {
    await page.goto(ruta);
    await expect(page, ruta).toHaveURL("/");
  }
  await expect(page.getByTestId("nav-jugadores")).toHaveAttribute("href", "/jugadores");
  await expect(page.getByTestId("nav-rosters")).toHaveAttribute("href", "/rosters");
});
