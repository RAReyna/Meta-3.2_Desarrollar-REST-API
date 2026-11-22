import { createRouter, createWebHistory } from "vue-router";
import { inicioDe, useAuthStore } from "@/stores/auth";
import type { Usuario } from "@/types";
import LoginView from "@/views/LoginView.vue";
import RegistroView from "@/views/RegistroView.vue";
import EnConstruccion from "@/views/EnConstruccion.vue";

// Qué exige cada ruta. Se declara en `meta` y lo revisa el guard de abajo.
declare module "vue-router" {
  interface RouteMeta {
    invitado?: boolean; // solo sin sesión (login, registro)
    rol?: Usuario["rol"]; // exige sesión con este rol
    irAlInicio?: boolean; // redirige a la página de inicio del usuario
  }
}

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/login", component: LoginView, meta: { invitado: true } },
    { path: "/registro", component: RegistroView, meta: { invitado: true } },

    // Consulta pública: no necesita cuenta
    { path: "/jugadores", component: EnConstruccion },
    { path: "/rosters", component: EnConstruccion },
    { path: "/rosters/:id", component: EnConstruccion },

    // Panel Admin
    { path: "/admin/jugadores", component: EnConstruccion, meta: { rol: "admin" } },
    { path: "/admin/rosters", component: EnConstruccion, meta: { rol: "admin" } },
    { path: "/admin/rosters/:id", component: EnConstruccion, meta: { rol: "admin" } },

    // "/" y cualquier ruta desconocida llevan al inicio del usuario
    { path: "/:pathMatch(.*)*", component: EnConstruccion, meta: { irAlInicio: true } },
  ],
});

// Antes de cada navegación: decide si se puede entrar o a dónde redirigir.
router.beforeEach(async (destino) => {
  const auth = useAuthStore();
  await auth.revisarSesion();
  const { usuario } = auth;

  const { invitado, rol, irAlInicio } = destino.meta;
  if (irAlInicio) return inicioDe(usuario);
  if (invitado && usuario) return inicioDe(usuario);
  if (rol && !usuario) return "/login";
  if (rol && usuario?.rol !== rol) return inicioDe(usuario);
});

export default router;
