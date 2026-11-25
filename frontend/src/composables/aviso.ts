import { ref } from "vue";

// Mensaje breve en la parte de abajo ("Jugador guardado"). Lo muestra App.vue.
export const aviso = ref({ visible: false, texto: "", color: "success" });

export function avisar(texto: string, color: "success" | "error" = "success") {
  aviso.value = { visible: true, texto, color };
}
