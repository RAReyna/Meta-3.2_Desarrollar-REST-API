import { expect, request, type Page } from "@playwright/test";

// Sufijo único por corrida: permite repetir las pruebas sin duplicados.
export const S = Date.now().toString(36);

export const ADMIN = {
  email: process.env.ADMIN_EMAIL!,
  password: process.env.ADMIN_PASSWORD!,
};

const BASE = "http://localhost:5173";
const API = "/api/v1";

// Inicia sesión desde el formulario y espera la redirección por rol.
export async function loginUI(
  page: Page,
  email: string,
  password: string,
  destino: string,
) {
  await page.goto("/login");
  await page.getByTestId("login-email").fill(email);
  await page.getByTestId("login-password").fill(password);
  await page.getByTestId("login-submit").click();
  await expect(page).toHaveURL(destino);
}

export const loginAdmin = (page: Page) =>
  loginUI(page, ADMIN.email, ADMIN.password, "/admin/jugadores");

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
