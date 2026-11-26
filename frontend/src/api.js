const BASE = "/api/v1";

// Error con el código HTTP y, si los hay, los detalles de validación del backend.
export class ApiError extends Error {
  constructor(status, mensaje, detalles) {
    super(mensaje);
    this.status = status;
    this.detalles = detalles;
  }
}

// Qué hacer cuando la sesión vence con la página abierta (lo define main.js).
let alVencerSesion = () => {};
export function cuandoVenzaLaSesion(accion) {
  alVencerSesion = accion;
}

// La cookie csrf_token NO es HttpOnly: el frontend la lee y la reenvía en un header.
function leerCookie(nombre) {
  const par = document.cookie.split("; ").find((c) => c.startsWith(nombre + "="));
  return par ? decodeURIComponent(par.slice(nombre.length + 1)) : undefined;
}

async function pedir(metodo, ruta, body) {
  const headers = {};
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

  if (res.status === 204) return undefined;

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    // Un 401 en /auth es normal (contraseña incorrecta, sin sesión al abrir la app).
    // En cualquier otra ruta significa que la sesión venció.
    if (res.status === 401 && !ruta.startsWith("/auth/")) alVencerSesion();
    throw new ApiError(res.status, data?.error ?? res.statusText, data?.detalles);
  }
  return data;
}

export const api = {
  get: (ruta) => pedir("GET", ruta),
  post: (ruta, body) => pedir("POST", ruta, body),
  put: (ruta, body) => pedir("PUT", ruta, body),
  del: (ruta) => pedir("DELETE", ruta),
};
