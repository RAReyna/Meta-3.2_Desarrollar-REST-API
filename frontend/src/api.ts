const BASE = "/api/v1";

export class ApiError extends Error {
  status: number;
  detalles?: unknown;

  constructor(status: number, mensaje: string, detalles?: unknown) {
    super(mensaje);
    this.status = status;
    this.detalles = detalles;
  }
}

// Qué hacer cuando la sesión vence con la página abierta (lo define main.ts).
let alVencerSesion = () => {};
export function cuandoVenzaLaSesion(accion: () => void) {
  alVencerSesion = accion;
}

// La cookie csrf_token NO es HttpOnly: el frontend la lee y la reenvía en un header.
function leerCookie(nombre: string): string | undefined {
  const par = document.cookie.split("; ").find((c) => c.startsWith(nombre + "="));
  return par ? decodeURIComponent(par.slice(nombre.length + 1)) : undefined;
}

async function pedir<T>(metodo: string, ruta: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";

  if (metodo !== "GET" && metodo !== "HEAD") {
    const csrf = leerCookie("csrf_token");
    if (csrf) headers["x-csrf-token"] = csrf;
  }

  const res = await fetch(BASE + ruta, {
    method: metodo,
    headers,
    credentials: "same-origin",
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (res.status === 204) return undefined as T;

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    // Un 401 en /auth es normal (contraseña incorrecta, sin sesión al abrir la app).
    // En cualquier otra ruta significa que la sesión venció.
    if (res.status === 401 && !ruta.startsWith("/auth/")) alVencerSesion();
    throw new ApiError(res.status, data?.error ?? res.statusText, data?.detalles);
  }
  return data as T;
}

export const api = {
  get: <T>(ruta: string) => pedir<T>("GET", ruta),
  post: <T>(ruta: string, body?: unknown) => pedir<T>("POST", ruta, body),
  put: <T>(ruta: string, body?: unknown) => pedir<T>("PUT", ruta, body),
  del: <T = void>(ruta: string) => pedir<T>("DELETE", ruta),
};
