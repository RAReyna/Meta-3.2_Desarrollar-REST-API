<script setup lang="ts">
// Formulario del admin para agregar un jugador al roster como titular o suplente.
// Los errores de las reglas del roster (5 titulares, rol repetido...) se muestran aquí.
import { computed, reactive, ref } from "vue";
import { api } from "@/api";
import { useRecurso } from "@/composables/useRecurso";
import { textoError } from "@/errores";
import { ROLES_EN_ROSTER, type Jugador, type RolEnRoster } from "@/types";

const props = defineProps<{ idRoster: number; yaEnRoster: number[] }>();
const emit = defineEmits<{ asignado: [] }>();

const { datos: jugadores } = useRecurso(() => api.get<Jugador[]>("/jugadores"), [] as Jugador[]);

// Solo los jugadores que todavía no están en el roster.
const disponibles = computed(() =>
  jugadores.value
    .filter((j) => !props.yaEnRoster.includes(j.id))
    .map((j) => ({ title: `${j.nickname} (${j.rol})`, value: j.id })),
);

const asignacion = reactive({
  id_jugador: null as number | null,
  rol_en_roster: "Suplente" as RolEnRoster,
});
const enviando = ref(false);
const error = ref("");

async function asignar() {
  enviando.value = true;
  error.value = "";
  try {
    await api.post(`/rosters/${props.idRoster}/jugadores`, asignacion);
    asignacion.id_jugador = null;
    emit("asignado");
  } catch (err) {
    error.value = textoError(err);
  } finally {
    enviando.value = false;
  }
}
</script>

<template>
  <v-card title="Asignar jugador">
    <v-card-text>
      <div class="d-flex flex-wrap align-center ga-4">
        <v-autocomplete
          v-model="asignacion.id_jugador"
          label="Jugador"
          :items="disponibles"
          no-data-text="No hay jugadores disponibles"
          hide-details
          class="campo-jugador"
          data-testid="asignar-jugador"
        />
        <v-btn-toggle
          v-model="asignacion.rol_en_roster"
          mandatory
          color="primary"
          variant="outlined"
          divided
        >
          <v-btn v-for="rol in ROLES_EN_ROSTER" :key="rol" :value="rol" :text="rol" />
        </v-btn-toggle>
        <v-btn
          color="primary"
          text="Asignar"
          :disabled="!asignacion.id_jugador"
          :loading="enviando"
          data-testid="asignar-submit"
          @click="asignar"
        />
      </div>
      <v-alert
        v-if="error"
        type="error"
        :text="error"
        closable
        class="mt-4"
        data-testid="asignar-error"
        @click:close="error = ''"
      />
    </v-card-text>
  </v-card>
</template>

<style scoped>
.campo-jugador {
  min-width: 240px;
}
</style>
