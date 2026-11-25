<script setup lang="ts">
// Diálogo "¿Seguro?" antes de eliminar. Ejecuta `accion`; si falla, muestra
// el error y queda abierto; si funciona, se cierra.
import { ref, watch } from "vue";
import { textoError } from "@/errores";

const abierto = defineModel<boolean>({ required: true });
const props = defineProps<{
  titulo: string;
  texto: string;
  accion: () => Promise<void>;
}>();

const enviando = ref(false);
const error = ref("");

watch(abierto, () => (error.value = ""));

async function confirmar() {
  enviando.value = true;
  try {
    await props.accion();
    abierto.value = false;
  } catch (err) {
    error.value = textoError(err);
  } finally {
    enviando.value = false;
  }
}
</script>

<template>
  <v-dialog v-model="abierto" max-width="440">
    <v-card :title="titulo" :text="texto">
      <v-card-text v-if="error">
        <v-alert type="error" :text="error" />
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn text="Cancelar" @click="abierto = false" />
        <v-btn
          color="error"
          text="Eliminar"
          :loading="enviando"
          data-testid="confirmar"
          @click="confirmar"
        />
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
