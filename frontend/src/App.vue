<script setup lang="ts">
import { computed } from "vue";
import { useRouter } from "vue-router";
import { useDisplay, useTheme } from "vuetify";
import { useAuthStore } from "@/stores/auth";
import { guardarTema } from "@/plugins/vuetify";
import { aviso } from "@/composables/aviso";

const auth = useAuthStore();
const router = useRouter();
const theme = useTheme();
const { smAndDown: esCelular } = useDisplay();

// Enlaces de la barra: los mismos para todos, con o sin sesión.
const enlaces = [
  { texto: "Jugadores", ruta: "/jugadores", icono: "mdi-account", testid: "nav-jugadores" },
  { texto: "Rosters", ruta: "/rosters", icono: "mdi-trophy", testid: "nav-rosters" },
];

const esOscuro = computed(() => theme.current.value.dark);

function cambiarTema() {
  const nuevo = esOscuro.value ? "light" : "dark";
  theme.change(nuevo);
  guardarTema(nuevo);
}

async function cerrarSesion() {
  await auth.logout();
  router.push("/");
}
</script>

<template>
  <v-app>
    <v-app-bar color="secondary">
      <!-- En celular, los enlaces van en un menú -->
      <template v-if="esCelular" #prepend>
        <v-menu>
          <template #activator="{ props }">
            <v-app-bar-nav-icon v-bind="props" aria-label="Menú" />
          </template>
          <v-list>
            <v-list-item
              v-for="enlace in enlaces"
              :key="enlace.ruta"
              :to="enlace.ruta"
              :prepend-icon="enlace.icono"
              :title="enlace.texto"
              :data-testid="enlace.testid"
            />
          </v-list>
        </v-menu>
      </template>

      <v-app-bar-title class="titulo-barra">
        <router-link to="/" class="titulo"> Roster Manager </router-link>
      </v-app-bar-title>

      <template v-if="!esCelular">
        <v-btn
          v-for="enlace in enlaces"
          :key="enlace.ruta"
          :to="enlace.ruta"
          :prepend-icon="enlace.icono"
          :data-testid="enlace.testid"
        >
          {{ enlace.texto }}
        </v-btn>
      </template>

      <v-spacer />

      <v-btn
        :icon="esOscuro ? 'mdi-weather-sunny' : 'mdi-weather-night'"
        :aria-label="esOscuro ? 'Tema claro' : 'Tema oscuro'"
        @click="cambiarTema"
      />

      <!-- Sin sesión: acceso a la cuenta (solo hace falta para administrar) -->
      <template v-if="!auth.usuario">
        <v-btn
          v-if="esCelular"
          to="/registro"
          icon="mdi-login"
          aria-label="Registrarse / Iniciar sesión"
          data-testid="btn-cuenta"
        />
        <v-btn
          v-else
          to="/registro"
          prepend-icon="mdi-login"
          variant="outlined"
          data-testid="btn-cuenta"
        >
          Registrarse / Iniciar sesión
        </v-btn>
      </template>

      <v-menu v-else>
        <template #activator="{ props }">
          <v-btn
            v-bind="props"
            icon="mdi-account-circle"
            aria-label="Cuenta"
            data-testid="menu-cuenta"
          />
        </template>
        <v-list>
          <v-list-item
            :title="auth.usuario.email"
            :subtitle="auth.esAdmin ? 'Administrador' : 'Solo lectura'"
            data-testid="usuario-email"
          />
          <v-divider />
          <v-list-item
            prepend-icon="mdi-logout"
            title="Cerrar sesión"
            data-testid="btn-logout"
            @click="cerrarSesion"
          />
        </v-list>
      </v-menu>
    </v-app-bar>

    <v-main>
      <v-container>
        <router-view />
      </v-container>
    </v-main>

    <v-snackbar
      v-model="aviso.visible"
      :color="aviso.color"
      :text="aviso.texto"
      timeout="3000"
      data-testid="aviso"
    />
  </v-app>
</template>

<style scoped>
/* El título mide lo que su texto: los enlaces quedan junto a él, no centrados */
.titulo-barra {
  flex: none;
  margin-inline-end: 16px;
}

.titulo {
  color: inherit;
  text-decoration: none;
}
</style>
