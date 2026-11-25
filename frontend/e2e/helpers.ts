import { expect, request, type Locator, type Page } from "@playwright/test";

// Sufijo único por corrida: permite repetir las pruebas sin duplicados.
export const S = Date.now().toString(36);

export const ADMIN = {
  email: process.env.ADMIN_EMAIL!,
  password: process.env.ADMIN_PASSWORD!,
};

const BASE = "http://localhost:5173";
const API = "/api/v1";

// Inicia sesión desde el formulario; después del login todos van a la portada.
export async function loginUI(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByTestId("login-email").locator("input").fill(email);
  await page.getByTestId("login-password").locator("input").fill(password);
  await page.getByTestId("login-submit").click();
  await expect(page).toHaveURL("/");
}

export const loginAdmin = (page: Page) => loginUI(page, ADMIN.email, ADMIN.password);

// El logout está dentro del menú de la cuenta.
export async function logout(page: Page) {
  await page.getByTestId("menu-cuenta").click();
  await page.getByTestId("btn-logout").click();
  await expect(page).toHaveURL("/");
}

// <v-select> y <v-autocomplete> no son <select> nativos: se abre la lista y se
// hace clic en la opción. `donde` limita la búsqueda (por ejemplo, a un diálogo).
// El <input> queda tapado por Vuetify, así que el clic va al campo que lo rodea.
export async function elegir(donde: Page | Locator, etiqueta: string, opcion: string) {
  const input = donde.getByLabel(etiqueta, { exact: true });
  await input.locator("xpath=ancestor::div[contains(@class, 'v-field ')][1]").click();
  const page = "page" in donde ? donde.page() : donde;
  await page.getByRole("option", { name: opcion, exact: true }).click();
}

// Filas de una v-data-table (sin la fila de "No hay ... que coincidan").
export const filas = (page: Page, tabla: string) =>
  page.getByTestId(tabla).locator("tbody tr:not(.v-data-table-rows-no-data)");

// Sesión por API (sin navegador) para preparar datos rápido.
// El contexto guarda las cookies; el header CSRF se agrega en cada escritura.
export async function sesionApi(
  email = ADMIN.email,
  password = ADMIN.password,
) {
  const ctx = await request.newContext({ baseURL: BASE });
  const r = await ctx.post(`${API}/auth/login`, { data: { email, password } });
  expect(r.status(), "login por API").toBe(200);
  const { csrfToken } = await r.json();
  const headers = { "x-csrf-token": csrfToken };

  // Escribe y devuelve el JSON; falla la prueba si el API no responde 2xx.
  async function escribir(metodo: "post" | "put" | "delete", ruta: string, data?: object) {
    const res = await ctx[metodo](API + ruta, { data, headers });
    expect(res.ok(), `${metodo.toUpperCase()} ${ruta}: ${await res.text()}`).toBe(true);
    return res.status() === 204 ? null : res.json();
  }

  return {
    ctx,
    csrf: csrfToken as string,
    get: async (ruta: string) => (await ctx.get(API + ruta)).json(),
    post: (ruta: string, data: object) => escribir("post", ruta, data),
    put: (ruta: string, data: object) => escribir("put", ruta, data),
    del: (ruta: string) => escribir("delete", ruta),
    cerrar: () => ctx.dispose(),
  };
}

export type SesionApi = Awaited<ReturnType<typeof sesionApi>>;

// Borra todo lo que contenga el sufijo de esta corrida (rosters primero).
export async function limpiar(api: SesionApi) {
  const rosters: { id: number; nombre: string }[] = await api.get("/rosters");
  for (const r of rosters.filter((r) => r.nombre.includes(S))) {
    await api.del(`/rosters/${r.id}`);
  }
  const jugadores: { id: number }[] = await api.get(`/jugadores?search=${S}`);
  for (const j of jugadores) await api.del(`/jugadores/${j.id}`);
}

// Crea una cuenta public por API (registro abierto) y devuelve sus credenciales.
export async function crearPublic(nombre: string) {
  const cuenta = { email: `e2e-${S}-${nombre}@example.com`, password: "Public12345" };
  const ctx = await request.newContext({ baseURL: BASE });
  const r = await ctx.post(`${API}/auth/registro`, { data: cuenta });
  expect(r.status(), "registro por API").toBe(201);
  await ctx.dispose();
  return cuenta;
}
