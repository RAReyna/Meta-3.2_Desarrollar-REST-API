<script setup lang="ts">
// Página provisional para las rutas que se construyen en la Fase 6.
import { useRoute } from "vue-router";

const ruta = useRoute();
</script>

<template>
  <v-empty-state
    icon="mdi-hammer-wrench"
    title="En construcción"
    :text="`La página ${ruta.path} llega en la siguiente fase.`"
  />
</template>
