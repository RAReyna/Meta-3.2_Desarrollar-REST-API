import "vuetify/styles";
import "@mdi/font/css/materialdesignicons.css";
import { createVuetify } from "vuetify";
import { es } from "vuetify/locale";

const CLAVE_TEMA = "tema";

// Tema guardado por el usuario; si no eligió ninguno, el del sistema.
function temaGuardado() {
  try {
    return localStorage.getItem(CLAVE_TEMA) ?? "system";
  } catch {
    return "system";
  }
}

export function guardarTema(nombre) {
  try {
    localStorage.setItem(CLAVE_TEMA, nombre);
  } catch {
    // Sin almacenamiento (modo privado): el tema dura hasta recargar.
  }
}

export default createVuetify({
  // Textos de los componentes (tablas, paginación...) en español
  locale: { locale: "es", messages: { es } },
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
