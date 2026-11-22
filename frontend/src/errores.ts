import { ApiError } from "./api";

interface Issue {
  path?: (string | number)[];
  message?: string;
}

// Convierte cualquier error del API en un texto legible para mostrar en pantalla.
export function textoError(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.status === 401) return "Tu sesión expiró. Vuelve a iniciar sesión.";
    if (err.status === 403) {
      return "Acción no permitida (sesión o token CSRF inválido).";
    }
    if (Array.isArray(err.detalles) && err.detalles.length > 0) {
      const partes = (err.detalles as Issue[]).map(
        (d) => `${(d.path ?? []).join(".")}: ${d.message ?? ""}`,
      );
      return `${err.message}. ${partes.join("; ")}`;
    }
    return err.message;
  }
  return "No se pudo conectar con el servidor";
}
