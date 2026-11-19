import { expect, test, type Page } from "@playwright/test";
import {
  S,
  crearPublic,
  limpiar,
  loginUI,
  sesionApi,
  type SesionApi,
} from "./helpers.ts";

let api: SesionApi;
let cuenta: { email: string; password: string };
let principal: { id: number };

// Datos de prueba preparados por el admin; temporada = S para filtrarlos.
test.beforeAll(async () => {
  api = await sesionApi();
  cuenta = await crearPublic("lector");

  const top = await api.post("/jugadores", { nickname: `P3top${S}`, rol: "Top" });
  const mid = await api.post("/jugadores", { nickname: `P3mid${S}`, rol: "Mid" });
  principal = await api.post("/rosters", { nombre: `P Principal ${S}`, tipo: "Principal", temporada: S });
  await api.post("/rosters", { nombre: `P Academy ${S}`, tipo: "Academy", temporada: S });
  await api.post(`/rosters/${principal.id}/jugadores`, { id_jugador: top.id, rol_en_roster: "Titular" });
  await api.post(`/rosters/${principal.id}/jugadores`, { id_jugador: mid.id, rol_en_roster: "Suplente" });
});

test.afterAll(async () => {
  await limpiar(api);
  await api.cerrar();
});

const entrar = (page: Page) =>
  loginUI(page, cuenta.email, cuenta.password, "/jugadores");

test("P1 registro de cuenta", async ({ page }) => {
  const email = `e2e-${S}-registro@example.com`;
  await page.goto("/login");
  await page.getByTestId("link-registro").click();
  await expect(page).toHaveURL("/registro");

  await page.getByTestId("registro-email").fill(email);
  await page.getByTestId("registro-password").fill("Public12345");
  await page.getByTestId("registro-submit").click();
  await expect(page).toHaveURL("/jugadores");
  await expect(page.getByTestId("usuario-email")).toHaveText(email);

  // El mismo email otra vez → error de duplicado
  await page.getByTestId("btn-logout").click();
  await page.goto("/registro");
  await page.getByTestId("registro-email").fill(email);
  await page.getByTestId("registro-password").fill("Public12345");
  await page.getByTestId("registro-submit").click();
  await expect(page.getByTestId("registro-error")).toHaveText(
    "Ese email ya está registrado",
  );
});

test("P2 login obligatorio", async ({ page }) => {
  for (const ruta of ["/", "/jugadores", "/rosters", `/rosters/${principal.id}`]) {
    await page.goto(ruta);
    await expect(page, `sin sesión: ${ruta}`).toHaveURL("/login");
  }
});

test("P3 jugadores: lista y filtros", async ({ page }) => {
  await entrar(page);
  const filas = page.getByTestId("fila-jugador");

  await page.getByTestId("filtro-search").fill(S);
  await expect(filas).toHaveCount(2);

  await page.getByTestId("filtro-rol").selectOption("Mid");
  await expect(filas).toHaveCount(1);
  await expect(filas).toContainText(`P3mid${S}`);
});

test("P4 rosters: filtros y detalle", async ({ page }) => {
  await entrar(page);
  await page.getByTestId("nav-rosters").click();
  const filas = page.getByTestId("fila-roster");

  await page.getByTestId("filtro-temporada").fill(S);
  await expect(filas).toHaveCount(2);
  await page.getByTestId("filtro-tipo").selectOption("Academy");
  await expect(filas).toHaveCount(1);
  await expect(filas).toContainText(`P Academy ${S}`);

  await page.getByTestId("filtro-tipo").selectOption("");
  await filas.filter({ hasText: "Principal" }).getByTestId("btn-ver").click();
  await expect(page).toHaveURL(`/rosters/${principal.id}`);
  await expect(page.getByTestId("roster-titulo")).toHaveText(`P Principal ${S}`);
  const asignados = page.getByTestId("fila-asignado");
  await expect(asignados).toHaveCount(2);
  await expect(asignados.filter({ hasText: `P3top${S}` })).toContainText("Titular");
  await expect(asignados.filter({ hasText: `P3mid${S}` })).toContainText("Suplente");

  await page.goto("/rosters/999999");
  await expect(page.getByTestId("error")).toHaveText("Roster no encontrado");
});

test("P5 solo lectura: sin controles de edición", async ({ page }) => {
  const controles = [
    "form-jugador", "btn-editar", "btn-eliminar",
    "form-roster", "form-asignar", "btn-quitar", "rol-en-roster",
  ];
  await entrar(page);

  // Espera a que cada página cargue sus datos antes de revisar la ausencia.
  const paginas: [string, string][] = [
    ["/jugadores", "tabla-jugadores"],
    ["/rosters", "tabla-rosters"],
    [`/rosters/${principal.id}`, "tabla-asignados"],
  ];
  for (const [ruta, tabla] of paginas) {
    await page.goto(ruta);
    await expect(page.getByTestId(tabla)).toBeVisible();
    for (const id of controles) {
      await expect(page.getByTestId(id), `${ruta}: ${id}`).toHaveCount(0);
    }
  }
});

test("P6 public no entra a /admin", async ({ page }) => {
  await entrar(page);
  for (const ruta of ["/admin/jugadores", "/admin/rosters", `/admin/rosters/${principal.id}`]) {
    await page.goto(ruta);
    await expect(page, ruta).toHaveURL("/jugadores");
  }
  await expect(page.getByTestId("nav-jugadores")).toHaveAttribute("href", "/jugadores");
  await expect(page.getByTestId("nav-rosters")).toHaveAttribute("href", "/rosters");
});
