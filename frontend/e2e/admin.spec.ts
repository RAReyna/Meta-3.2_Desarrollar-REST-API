import { expect, test } from "@playwright/test";
import {
  ADMIN,
  S,
  elegir,
  filas,
  limpiar,
  loginAdmin,
  logout,
  sesionApi,
  type SesionApi,
} from "./helpers.ts";

let api: SesionApi;

test.beforeAll(async () => {
  api = await sesionApi();
});

test.afterAll(async () => {
  await limpiar(api);
  await api.cerrar();
});

test("A1 login y logout", async ({ page }) => {
  await page.goto("/login");
  await page.getByTestId("login-email").locator("input").fill(ADMIN.email);
  await page.getByTestId("login-password").locator("input").fill("incorrecta");
  await page.getByTestId("login-submit").click();
  await expect(page.getByTestId("login-error")).toBeVisible();

  await loginAdmin(page);
  await page.getByTestId("menu-cuenta").click();
  await expect(page.getByTestId("usuario-email")).toContainText(ADMIN.email.toLowerCase());
  await expect(page.getByTestId("usuario-email")).toContainText("Administrador");
  // Cierra el menú y espera a que termine la animación antes de volver a abrirlo
  await page.keyboard.press("Escape");
  await expect(page.getByTestId("usuario-email")).toBeHidden();

  await logout(page);
  await expect(page.getByTestId("btn-cuenta")).toBeVisible();
});

test("A2 CRUD de jugadores", async ({ page }) => {
  const nick = `A2${S}`;
  await loginAdmin(page);
  await page.goto("/jugadores");

  await page.getByTestId("nuevo-jugador").click();
  const dialogo = page.getByRole("dialog");
  await dialogo.getByLabel("Nickname").fill(nick);
  await dialogo.getByLabel("País (opcional)").fill("México");
  await elegir(dialogo, "Rol", "Mid");
  await dialogo.getByTestId("jugador-guardar").click();
  await expect(page.getByTestId("aviso")).toContainText("Jugador creado");

  await page.getByLabel("Buscar por nickname", { exact: true }).fill(nick);
  const fila = filas(page, "tabla-jugadores").filter({ hasText: nick });
  await expect(fila).toContainText("México");
  await expect(fila).toContainText("Mid");

  await page.getByRole("button", { name: `Editar ${nick}` }).click();
  await expect(dialogo.getByLabel("Nickname")).toHaveValue(nick);
  await dialogo.getByLabel("País (opcional)").fill("Argentina");
  await dialogo.getByTestId("jugador-guardar").click();
  await expect(fila).toContainText("Argentina");

  await page.getByRole("button", { name: `Eliminar ${nick}` }).click();
  await page.getByTestId("confirmar").click();
  await expect(fila).toHaveCount(0);
  expect(await api.get(`/jugadores?search=${nick}`)).toHaveLength(0);
});

test("A3 filtros de jugadores", async ({ page }) => {
  await api.post("/jugadores", { nickname: `A3top${S}`, rol: "Top" });
  await api.post("/jugadores", { nickname: `A3mid${S}`, rol: "Mid", estado: "inactivo" });
  await loginAdmin(page);
  await page.goto("/jugadores");
  const lista = filas(page, "tabla-jugadores");

  await page.getByLabel("Buscar por nickname", { exact: true }).fill(`A3`);
  await expect(lista.filter({ hasText: S })).toHaveCount(2);

  await elegir(page, "Estado", "activo");
  await expect(lista.filter({ hasText: S })).toHaveCount(1);
  await expect(lista.filter({ hasText: S })).toContainText(`A3top${S}`);

  await elegir(page, "Estado", "inactivo");
  await elegir(page, "Rol", "Mid");
  await expect(lista.filter({ hasText: S })).toHaveCount(1);
  await expect(lista.filter({ hasText: S })).toContainText(`A3mid${S}`);
});

test("A4 CRUD de rosters", async ({ page }) => {
  const nombre = `A4 ${S}`;
  await loginAdmin(page);
  await page.goto("/rosters");

  await page.getByTestId("nuevo-roster").click();
  const dialogo = page.getByRole("dialog");
  await dialogo.getByLabel("Nombre").fill(nombre);
  await elegir(dialogo, "Tipo", "Academy");
  await dialogo.getByLabel("Temporada").fill(S);
  await dialogo.getByTestId("roster-guardar").click();

  const fila = filas(page, "tabla-rosters").filter({ hasText: nombre });
  await expect(fila).toContainText("Academy");
  await expect(fila).toContainText(S);

  await page.getByRole("button", { name: `Editar ${nombre}` }).click();
  await dialogo.getByLabel("Nombre").fill(`${nombre} editado`);
  await dialogo.getByTestId("roster-guardar").click();
  const editada = filas(page, "tabla-rosters").filter({ hasText: `${nombre} editado` });
  await expect(editada).toHaveCount(1);
  // El botón Editar no abre el detalle
  await expect(page).toHaveURL("/rosters");

  await page.getByRole("button", { name: `Eliminar ${nombre} editado` }).click();
  await page.getByTestId("confirmar").click();
  await expect(editada).toHaveCount(0);
});

test("A5 asignar, cambiar rol y quitar jugador", async ({ page }) => {
  const roster = await api.post("/rosters", {
    nombre: `A5 ${S}`,
    tipo: "Principal",
    temporada: "2026",
  });
  const jugador = await api.post("/jugadores", { nickname: `A5${S}`, rol: "Jungle" });
  await loginAdmin(page);
  await page.goto(`/rosters/${roster.id}`);
  const titulares = page.getByTestId("titulares");
  const suplentes = page.getByTestId("suplentes");

  await elegir(page, "Jugador", `${jugador.nickname} (Jungle)`);
  await page.getByRole("button", { name: "Titular", exact: true }).click();
  await page.getByTestId("asignar-submit").click();
  await expect(titulares.getByTestId("jugador-en-roster")).toContainText(jugador.nickname);
  await expect(titulares).toContainText("Titulares (1/5)");

  await page.getByRole("button", { name: `Pasar ${jugador.nickname} a suplente` }).click();
  await expect(suplentes.getByTestId("jugador-en-roster")).toContainText(jugador.nickname);
  await page.reload();
  await expect(suplentes.getByTestId("jugador-en-roster")).toContainText(jugador.nickname);
  await expect(titulares).toContainText("Titulares (0/5)");

  await page.getByRole("button", { name: `Quitar a ${jugador.nickname}` }).click();
  await page.getByTestId("confirmar").click();
  await expect(page.getByTestId("jugador-en-roster")).toHaveCount(0);
  await expect(page.getByText("Sin jugadores")).toHaveCount(2);
});

test("A6 errores de reglas de negocio", async ({ page }) => {
  // Nickname duplicado (RN-01)
  await api.post("/jugadores", { nickname: `A6dup${S}`, rol: "Top" });
  await loginAdmin(page);
  await page.goto("/jugadores");
  await page.getByTestId("nuevo-jugador").click();
  const dialogo = page.getByRole("dialog");
  await dialogo.getByLabel("Nickname").fill(`A6dup${S}`);
  await dialogo.getByTestId("jugador-guardar").click();
  await expect(dialogo.getByTestId("jugador-error")).toContainText("El nickname ya existe");
  await page.keyboard.press("Escape");

  // Sexto titular (RN-02)
  const roster = await api.post("/rosters", {
    nombre: `A6 ${S}`,
    tipo: "Principal",
    temporada: "2026",
  });
  for (const rol of ["Top", "Jungle", "Mid", "ADC", "Support"]) {
    const j = await api.post("/jugadores", { nickname: `A6${rol}${S}`, rol });
    await api.post(`/rosters/${roster.id}/jugadores`, {
      id_jugador: j.id,
      rol_en_roster: "Titular",
    });
  }
  const sexto = await api.post("/jugadores", { nickname: `A6sexto${S}`, rol: "Mid" });
  await page.goto(`/rosters/${roster.id}`);
  await elegir(page, "Jugador", `${sexto.nickname} (Mid)`);
  await page.getByRole("button", { name: "Titular", exact: true }).click();
  await page.getByTestId("asignar-submit").click();
  await expect(page.getByTestId("asignar-error")).toContainText("El roster ya tiene 5 titulares");
  await expect(page.getByTestId("titulares")).toContainText("Titulares (5/5)");
});

test("A7 sesión vencida con la página abierta → login y de regreso", async ({ page, context }) => {
  const nick = `A7${S}`;
  await loginAdmin(page);
  await page.goto("/jugadores");
  await page.getByTestId("nuevo-jugador").click();

  // Al vencer, el navegador borra las cookies (maxAge); la página no se entera.
  await context.clearCookies();

  const dialogo = page.getByRole("dialog");
  await dialogo.getByLabel("Nickname").fill(nick);
  await elegir(dialogo, "Rol", "Mid");
  await dialogo.getByTestId("jugador-guardar").click();

  await expect(page).toHaveURL("/login?volver=/jugadores");
  await expect(page.getByTestId("aviso")).toContainText("Tu sesión expiró");
  await expect(page.getByTestId("btn-cuenta")).toBeVisible();
  expect(await api.get(`/jugadores?search=${nick}`)).toHaveLength(0);

  // Al volver a entrar regresa a la página donde estaba.
  await page.getByTestId("login-email").locator("input").fill(ADMIN.email);
  await page.getByTestId("login-password").locator("input").fill(ADMIN.password);
  await page.getByTestId("login-submit").click();
  await expect(page).toHaveURL("/jugadores");
  await expect(page.getByTestId("nuevo-jugador")).toBeVisible();
});
