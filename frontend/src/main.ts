import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import router from "./router";
import vuetify from "./plugins/vuetify";
import { cuandoVenzaLaSesion } from "./api";
import { avisar } from "./composables/aviso";
import { useAuthStore } from "./stores/auth";

createApp(App).use(createPinia()).use(router).use(vuetify).mount("#app");

// Si la sesión vence con la página abierta (por ejemplo, tras una hora sin usarla),
// la primera acción que falle con 401 manda al login y luego regresa a la misma página.
cuandoVenzaLaSesion(() => {
  const auth = useAuthStore();
  if (!auth.usuario) return;
  auth.olvidarSesion();
  avisar("Tu sesión expiró. Vuelve a iniciar sesión.", "error");
  router.push({ path: "/login", query: { volver: router.currentRoute.value.fullPath } });
});
