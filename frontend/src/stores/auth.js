import { defineStore } from "pinia";
import { computed, ref } from "vue";
import { api } from "@/api";

// Sesión del usuario. La cookie la maneja el navegador; aquí solo
// guardamos quién es el usuario ({ id, email, rol }) para mostrarlo y saber si es admin.
export const useAuthStore = defineStore("auth", () => {
  const usuario = ref(null);
  const esAdmin = computed(() => usuario.value?.rol === "admin");
  let sesionRevisada = false;

  // Al abrir la app pregunta al backend si la cookie sigue siendo válida.
  // Solo lo hace una vez; después basta con el estado guardado.
  async function revisarSesion() {
    if (sesionRevisada) return;
    try {
      usuario.value = (await api.get("/auth/me")).usuario;
    } catch {
      usuario.value = null;
    }
    sesionRevisada = true;
  }

  // Login y registro responden igual: el backend deja la sesión abierta.
  async function login(email, password) {
    const r = await api.post("/auth/login", { email, password });
    usuario.value = r.usuario;
  }

  async function registro(email, password) {
    const r = await api.post("/auth/registro", { email, password });
    usuario.value = r.usuario;
  }

  async function logout() {
    try {
      await api.post("/auth/logout");
    } catch {
      // Si la sesión ya había expirado, igual limpiamos el estado local.
    }
    olvidarSesion();
  }

  // Borra la sesión solo en el frontend (el backend ya no la acepta).
  function olvidarSesion() {
    usuario.value = null;
  }

  return { usuario, esAdmin, revisarSesion, login, registro, logout, olvidarSesion };
});
