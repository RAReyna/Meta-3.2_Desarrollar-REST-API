import { expect, test } from "@playwright/test";
import { ADMIN, S, limpiar, loginAdmin, sesionApi, type SesionApi } from "./helpers.ts";

let api: SesionApi;

test.beforeAll(async () => {
  api = await sesionApi();
});

test.afterAll(async () => {
  await limpiar(api);
  await api.cerrar();
});

// Los botones Eliminar/Quitar usan window.confirm; Playwright los rechaza
// por defecto, así que cada prueba que borra acepta el diálogo.
test.beforeEach(async ({ page }) => {
  page.on("dialog", (d) => d.accept());
});

test("A1 login y logout", async ({ page }) => {
  await page.goto("/login");
  await page.getByTestId("login-email").fill(ADMIN.email);
  await page.getByTestId("login-password").fill("incorrecta");
  await page.getByTestId("login-submit").click();
  await expect(page.getByTestId("login-error")).toBeVisible();

  await loginAdmin(page);
  await expect(page.getByTestId("usuario-email")).toHaveText(ADMIN.email.toLowerCase());

  await page.getByTestId("btn-logout").click();
  await expect(page).toHaveURL("/login");
});

test("A2 CRUD de jugadores", async ({ page }) => {
  const nick = `A2${S}`;
  await loginAdmin(page);

  await page.getByTestId("jugador-nickname").fill(nick);
  await page.getByTestId("jugador-pais").fill("México");
  await page.getByTestId("jugador-rol").selectOption("Mid");
  await page.getByTestId("jugador-guardar").click();
  const fila = page.getByTestId("fila-jugador").filter({ hasText: nick });
  await expect(fila).toContainText("México");

  await fila.getByTestId("btn-editar").click();
  await page.getByTestId("jugador-pais").fill("Argentina");
  await page.getByTestId("jugador-guardar").click();
  await expect(fila).toContainText("Argentina");

  await fila.getByTestId("btn-eliminar").click();
  await expect(fila).toHaveCount(0);
});

test("A3 filtros de jugadores", async ({ page }) => {
  await api.post("/jugadores", { nickname: `A3top${S}`, rol: "Top" });
  await api.post("/jugadores", { nickname: `A3mid${S}`, rol: "Mid", estado: "inactivo" });
  await loginAdmin(page);
  const filas = page.getByTestId("fila-jugador");

  await page.getByTestId("filtro-search").fill(S);
  await expect(filas.filter({ hasText: `A3` })).toHaveCount(2);

  await page.getByTestId("filtro-rol").selectOption("Mid");
  await expect(filas).toHaveCount(1);
  await expect(filas).toContainText(`A3mid${S}`);

  await page.getByTestId("filtro-rol").selectOption("");
  await page.getByTestId("filtro-estado").selectOption("activo");
  await expect(filas.filter({ hasText: `A3` })).toHaveCount(1);
  await expect(filas.filter({ hasText: `A3` })).toContainText(`A3top${S}`);
});

test("A4 CRUD de rosters", async ({ page }) => {
  const nombre = `A4 ${S}`;
  await loginAdmin(page);
  await page.getByTestId("nav-rosters").click();

  await page.getByTestId("roster-nombre").fill(nombre);
  await page.getByTestId("roster-tipo").selectOption("Academy");
  await page.getByTestId("roster-guardar").click();
  const fila = page.getByTestId("fila-roster").filter({ hasText: nombre });
  await expect(fila).toContainText("Academy");

  await fila.getByTestId("btn-ver").click();
  await expect(page.getByTestId("roster-titulo")).toHaveText(nombre);
  await page.getByTestId("roster-nombre").fill(`${nombre} editado`);
  await page.getByTestId("roster-guardar").click();
  await expect(page.getByTestId("roster-guardado")).toBeVisible();
  await expect(page.getByTestId("roster-titulo")).toHaveText(`${nombre} editado`);

  await page.getByTestId("nav-rosters").click();
  const editada = page.getByTestId("fila-roster").filter({ hasText: `${nombre} editado` });
  await editada.getByTestId("btn-eliminar").click();
  await expect(editada).toHaveCount(0);
});

test("A5 asignar, cambiar rol y quitar jugador", async ({ page }) => {
  const roster = await api.post("/rosters", { nombre: `A5 ${S}`, tipo: "Principal", temporada: "2026" });
  const jugador = await api.post("/jugadores", { nickname: `A5${S}`, rol: "Jungle" });
  await loginAdmin(page);
  await page.goto(`/admin/rosters/${roster.id}`);

  await page.getByTestId("asignar-jugador").selectOption(String(jugador.id));
  await page.getByTestId("asignar-rol").selectOption("Titular");
  await page.getByTestId("asignar-submit").click();
  const fila = page.getByTestId("fila-asignado").filter({ hasText: jugador.nickname });
  await expect(fila.getByTestId("rol-en-roster")).toHaveValue("Titular");

  await fila.getByTestId("rol-en-roster").selectOption("Suplente");
  await page.reload();
  await expect(fila.getByTestId("rol-en-roster")).toHaveValue("Suplente");

  await fila.getByTestId("btn-quitar").click();
  await expect(page.getByTestId("roster-sin-jugadores")).toBeVisible();
});

test("A6 errores de reglas de negocio", async ({ page }) => {
  // Nickname duplicado (RN-01)
  await api.post("/jugadores", { nickname: `A6dup${S}`, rol: "Top" });
  await loginAdmin(page);
  await page.getByTestId("jugador-nickname").fill(`A6dup${S}`);
  await page.getByTestId("jugador-guardar").click();
  await expect(page.getByTestId("error")).toContainText("El nickname ya existe");

  // Sexto titular (RN-02)
  const roster = await api.post("/rosters", { nombre: `A6 ${S}`, tipo: "Principal", temporada: "2026" });
  for (const rol of ["Top", "Jungle", "Mid", "ADC", "Support"]) {
    const j = await api.post("/jugadores", { nickname: `A6${rol}${S}`, rol });
    await api.post(`/rosters/${roster.id}/jugadores`, { id_jugador: j.id, rol_en_roster: "Titular" });
  }
  const sexto = await api.post("/jugadores", { nickname: `A6sexto${S}`, rol: "Mid" });
  await page.goto(`/admin/rosters/${roster.id}`);
  await page.getByTestId("asignar-jugador").selectOption(String(sexto.id));
  await page.getByTestId("asignar-rol").selectOption("Titular");
  await page.getByTestId("asignar-submit").click();
  await expect(page.getByTestId("error")).toContainText("El roster ya tiene 5 titulares");
});

test("A7 /admin sin sesión redirige a /login", async ({ page }) => {
  await page.goto("/admin/jugadores");
  await expect(page).toHaveURL("/login");
  await page.goto("/admin/rosters");
  await expect(page).toHaveURL("/login");
});
