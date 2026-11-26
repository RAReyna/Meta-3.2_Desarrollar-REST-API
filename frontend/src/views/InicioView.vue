<script setup>
// Portada: dos tarjetas, una para jugadores y otra para rosters.
import { computed } from "vue";
import { api } from "@/api";
import { useRecurso } from "@/composables/useRecurso";

const jugadores = useRecurso(() => api.get("/jugadores"), []);
const rosters = useRecurso(() => api.get("/rosters"), []);

// Texto con el total, o "Cargando…" mientras llega.
const total = (cargando, cantidad, nombre) => (cargando ? "Cargando…" : `${cantidad} ${nombre}`);

const tarjetas = computed(() => [
  {
    titulo: "Jugadores",
    ruta: "/jugadores",
    icono: "mdi-account",
    total: total(jugadores.cargando.value, jugadores.datos.value.length, "jugadores"),
    texto: "Busca jugadores por nickname, rol o estado.",
    testid: "inicio-jugadores",
  },
  {
    titulo: "Rosters",
    ruta: "/rosters",
    icono: "mdi-trophy",
    total: total(rosters.cargando.value, rosters.datos.value.length, "rosters"),
    texto: "Consulta los equipos con sus titulares y suplentes.",
    testid: "inicio-rosters",
  },
]);
</script>

<template>
  <div class="text-center my-8">
    <h1 class="text-headline-large mb-2">Roster Manager</h1>
    <p class="text-body-large text-medium-emphasis">
      Jugadores y equipos de League of Legends. Elige qué quieres consultar.
    </p>
  </div>

  <v-row justify="center">
    <v-col v-for="tarjeta in tarjetas" :key="tarjeta.ruta" cols="12" sm="6" md="5">
      <v-card :to="tarjeta.ruta" hover class="pa-6 text-center h-100" :data-testid="tarjeta.testid">
        <v-icon :icon="tarjeta.icono" size="72" color="primary" />
        <v-card-title class="text-headline-small">
          {{ tarjeta.titulo }}
        </v-card-title>
        <v-card-subtitle>{{ tarjeta.total }}</v-card-subtitle>
        <v-card-text>{{ tarjeta.texto }}</v-card-text>
      </v-card>
    </v-col>
  </v-row>
</template>
