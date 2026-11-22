<script setup lang="ts">
// Pantalla provisional de la Fase 4: comprueba Vuetify, el tema y el proxy al API.
// Se reemplaza en la Fase 5 por el layout con router y sesión.
import { onMounted, ref } from "vue";
import { useTheme } from "vuetify";
import { guardarTema } from "./plugins/vuetify";

const theme = useTheme();
const estadoApi = ref<"cargando" | "ok" | "error">("cargando");

function cambiarTema() {
  const nuevo = theme.current.value.dark ? "light" : "dark";
  theme.change(nuevo);
  guardarTema(nuevo);
}

onMounted(async () => {
  try {
    const res = await fetch("/api/v1/health");
    estadoApi.value = res.ok ? "ok" : "error";
  } catch {
    estadoApi.value = "error";
  }
});
</script>

<template>
  <v-app>
    <v-app-bar color="secondary">
      <v-app-bar-title>Roster Manager</v-app-bar-title>
      <v-btn
        :icon="theme.current.value.dark ? 'mdi-weather-sunny' : 'mdi-weather-night'"
        :aria-label="theme.current.value.dark ? 'Tema claro' : 'Tema oscuro'"
        @click="cambiarTema"
      />
    </v-app-bar>

    <v-main>
      <v-container>
        <v-alert
          v-if="estadoApi === 'cargando'"
          type="info"
          text="Conectando con el API…"
        />
        <v-alert
          v-else-if="estadoApi === 'ok'"
          type="success"
          text="El API responde en /api/v1/health"
        />
        <v-alert
          v-else
          type="error"
          text="No hay respuesta del API. ¿Está corriendo el backend?"
        />
      </v-container>
    </v-main>
  </v-app>
</template>
