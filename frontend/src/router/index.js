import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import InicioView from "@/views/InicioView.vue";
import JugadoresView from "@/views/JugadoresView.vue";
import RostersView from "@/views/RostersView.vue";
import RosterDetalleView from "@/views/RosterDetalleView.vue";
import LoginView from "@/views/LoginView.vue";
import RegistroView from "@/views/RegistroView.vue";

// Todas las páginas son públicas. El admin usa las mismas y además
// ve los botones para crear, editar y eliminar.
// meta.invitado: la página es solo para quien no tiene sesión (login, registro).
const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/", component: InicioView },
    { path: "/jugadores", component: JugadoresView },
    { path: "/rosters", component: RostersView },
    { path: "/rosters/:id", component: RosterDetalleView },
    { path: "/login", component: LoginView, meta: { invitado: true } },
    { path: "/registro", component: RegistroView, meta: { invitado: true } },
    { path: "/:pathMatch(.*)*", redirect: "/" },
  ],
});

// Antes de cada navegación revisa la sesión (solo la primera vez pregunta al
// backend). Quien ya tiene sesión no necesita login ni registro.
router.beforeEach(async (destino) => {
  const auth = useAuthStore();
  await auth.revisarSesion();
  if (destino.meta.invitado && auth.usuario) return "/";
});

export default router;
