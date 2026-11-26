import { ApiError } from "./api";

// Convierte cualquier error del API en un texto legible para mostrar en pantalla.
// `detalles` son los problemas que encontró Zod: [{ path: ["nickname"], message: "..." }].
export function textoError(err) {
  if (err instanceof ApiError) {
    if (err.status === 401) return "Tu sesión expiró. Vuelve a iniciar sesión.";
    if (err.status === 403) return "No tienes permiso para hacer esto.";
    if (Array.isArray(err.detalles) && err.detalles.length > 0) {
      const partes = err.detalles.map((d) => `${(d.path ?? []).join(".")}: ${d.message ?? ""}`);
      return `${err.message}. ${partes.join("; ")}`;
    }
    return err.message;
  }
  return "No se pudo conectar con el servidor";
}
