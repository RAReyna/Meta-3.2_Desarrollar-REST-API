import { defineStore } from "pinia";
import { ref } from "vue";
import { api } from "@/api";
import type { Usuario } from "@/types";

interface RespuestaSesion {
  usuario: Usuario;
}

// Sesión del usuario. La cookie la maneja el navegador; aquí solo
// guardamos quién es el usuario para mostrarlo y decidir a dónde puede ir.
export const useAuthStore = defineStore("auth", () => {
  const usuario = ref<Usuario | null>(null);
  let sesionRevisada = false;

  // Al abrir la app pregunta al backend si la cookie sigue siendo válida.
  // Solo lo hace una vez; después basta con el estado guardado.
  async function revisarSesion() {
    if (sesionRevisada) return;
    try {
      usuario.value = (await api.get<RespuestaSesion>("/auth/me")).usuario;
    } catch {
      usuario.value = null;
    }
    sesionRevisada = true;
  }

  // Login y registro responden igual: el backend deja la sesión abierta.
  async function login(email: string, password: string) {
    const r = await api.post<RespuestaSesion>("/auth/login", { email, password });
    usuario.value = r.usuario;
    return r.usuario;
  }

  async function registro(email: string, password: string) {
    const r = await api.post<RespuestaSesion>("/auth/registro", { email, password });
    usuario.value = r.usuario;
    return r.usuario;
  }

  async function logout() {
    try {
      await api.post("/auth/logout");
    } catch {
      // Si la sesión ya había expirado, igual limpiamos el estado local.
    }
    usuario.value = null;
  }

  return { usuario, revisarSesion, login, registro, logout };
});

// Página de inicio: el admin va a su panel; todos los demás, con o sin
// cuenta, a la consulta pública.
export function inicioDe(usuario: Usuario | null): string {
  return usuario?.rol === "admin" ? "/admin/jugadores" : "/jugadores";
}
