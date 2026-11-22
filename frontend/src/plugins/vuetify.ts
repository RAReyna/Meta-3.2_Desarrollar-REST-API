import "vuetify/styles";
import "@mdi/font/css/materialdesignicons.css";
import { createVuetify } from "vuetify";

const CLAVE_TEMA = "tema";

// Tema guardado por el usuario; si no eligió ninguno, el del sistema.
function temaGuardado(): string {
  try {
    return localStorage.getItem(CLAVE_TEMA) ?? "system";
  } catch {
    return "system";
  }
}

export function guardarTema(nombre: string) {
  try {
    localStorage.setItem(CLAVE_TEMA, nombre);
  } catch {
    // Sin almacenamiento (modo privado): el tema dura hasta recargar.
  }
}

export default createVuetify({
  theme: {
    defaultTheme: temaGuardado(),
    themes: {
      light: {
        colors: { primary: "#3b5bdb", secondary: "#1f2430" },
      },
      dark: {
        colors: { primary: "#748ffc", secondary: "#1f2430" },
      },
    },
  },
});
