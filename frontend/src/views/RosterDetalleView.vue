<script setup lang="ts">
// Detalle de un roster: titulares y suplentes. El admin además asigna
// jugadores, cambia su rol en el roster y los quita.
import { computed, reactive, ref } from "vue";
import { useRoute } from "vue-router";
import { api } from "@/api";
import { COLOR_TIPO } from "@/colores";
import { avisar } from "@/composables/aviso";
import { useRecurso } from "@/composables/useRecurso";
import { textoError } from "@/errores";
import { useAuthStore } from "@/stores/auth";
import {
  ROLES,
  ROLES_EN_ROSTER,
  type Jugador,
  type JugadorEnRoster,
  type RolEnRoster,
  type RosterDetalle,
} from "@/types";
import ConfirmarDialogo from "@/components/ConfirmarDialogo.vue";

const MAX_TITULARES = 5;

const auth = useAuthStore();
const id = Number(useRoute().params.id);

const { datos: roster, cargando, error, recargar } = useRecurso<RosterDetalle | null>(
  () => api.get(`/rosters/${id}`),
  null,
);

// Titulares y suplentes, cada grupo ordenado por rol (Top, Jungle, Mid...).
function deTipo(rolEnRoster: RolEnRoster) {
  return (roster.value?.jugadores ?? [])
    .filter((j) => j.rol_en_roster === rolEnRoster)
    .sort((a, b) => ROLES.indexOf(a.rol) - ROLES.indexOf(b.rol));
}
const titulares = computed(() => deTipo("Titular"));
const suplentes = computed(() => deTipo("Suplente"));

const grupos = computed(() => [
  { titulo: `Titulares (${titulares.value.length}/${MAX_TITULARES})`, jugadores: titulares.value, esTitular: true },
  { titulo: `Suplentes (${suplentes.value.length})`, jugadores: suplentes.value, esTitular: false },
]);

const migas = computed(() => [
  { title: "Rosters", to: "/rosters" },
  { title: roster.value?.nombre ?? "…", disabled: true },
]);

// ---- Acciones del admin ----

// Errores de las reglas del roster (5 titulares, rol repetido...) que devuelve el backend.
const errorAccion = ref("");

async function intentar(accion: () => Promise<unknown>, exito: string) {
  errorAccion.value = "";
  try {
    await accion();
    avisar(exito);
    await recargar();
  } catch (err) {
    errorAccion.value = textoError(err);
  }
}

// Jugadores que todavía no están en el roster (para el selector).
// Solo el admin los necesita, así que solo se piden si es admin.
const todos = useRecurso(
  () => (auth.esAdmin ? api.get<Jugador[]>("/jugadores") : Promise.resolve([])),
  [] as Jugador[],
);
const disponibles = computed(() => {
  const enRoster = new Set(roster.value?.jugadores.map((j) => j.id));
  return todos.datos.value
    .filter((j) => !enRoster.has(j.id))
    .map((j) => ({ title: `${j.nickname} (${j.rol})`, value: j.id }));
});

const nuevo = reactive({
  id_jugador: null as number | null,
  rol_en_roster: "Suplente" as RolEnRoster,
});
const asignando = ref(false);

async function asignar() {
  asignando.value = true;
  await intentar(() => api.post(`/rosters/${id}/jugadores`, nuevo), "Jugador asignado");
  if (!errorAccion.value) nuevo.id_jugador = null;
  asignando.value = false;
}

function cambiarRol(jugador: JugadorEnRoster) {
  const rol_en_roster = jugador.rol_en_roster === "Titular" ? "Suplente" : "Titular";
  intentar(
    () => api.put(`/rosters/${id}/jugadores/${jugador.id}`, { rol_en_roster }),
    `${jugador.nickname} ahora es ${rol_en_roster.toLowerCase()}`,
  );
}

const confirmacion = ref(false);
const porQuitar = ref<JugadorEnRoster | null>(null);

function pedirQuitar(jugador: JugadorEnRoster) {
  porQuitar.value = jugador;
  confirmacion.value = true;
}

async function quitar() {
  if (!porQuitar.value) return;
  await api.del(`/rosters/${id}/jugadores/${porQuitar.value.id}`);
  avisar(`${porQuitar.value.nickname} salió del roster`);
  recargar();
}
</script>

<template>
  <v-breadcrumbs
    :items="migas"
    class="px-0"
  />

  <v-alert
    v-if="error"
    type="error"
    :text="error"
  />
  <v-progress-linear
    v-else-if="cargando && !roster"
    indeterminate
  />

  <template v-if="roster">
    <div class="d-flex flex-wrap align-center ga-2 mb-4">
      <h1 class="text-headline-medium me-2">
        {{ roster.nombre }}
      </h1>
      <v-chip
        :text="roster.tipo"
        :color="COLOR_TIPO[roster.tipo]"
        size="small"
      />
      <v-chip
        :text="`Temporada ${roster.temporada}`"
        size="small"
        variant="outlined"
      />
      <v-chip
        :text="roster.juego"
        size="small"
        variant="outlined"
      />
    </div>

    <!-- Asignar jugador (solo admin) -->
    <v-card
      v-if="auth.esAdmin"
      title="Asignar jugador"
      class="mb-4"
    >
      <v-card-text>
        <div class="d-flex flex-wrap align-center ga-4">
          <v-autocomplete
            v-model="nuevo.id_jugador"
            label="Jugador"
            :items="disponibles"
            no-data-text="No hay jugadores disponibles"
            hide-details
            class="campo-jugador"
            data-testid="asignar-jugador"
          />
          <v-btn-toggle
            v-model="nuevo.rol_en_roster"
            mandatory
            color="primary"
            variant="outlined"
            divided
          >
            <v-btn
              v-for="rol in ROLES_EN_ROSTER"
              :key="rol"
              :value="rol"
              :text="rol"
            />
          </v-btn-toggle>
          <v-btn
            color="primary"
            text="Asignar"
            :disabled="!nuevo.id_jugador"
            :loading="asignando"
            data-testid="asignar-submit"
            @click="asignar"
          />
        </div>
      </v-card-text>
    </v-card>

    <v-alert
      v-if="errorAccion"
      type="error"
      :text="errorAccion"
      closable
      class="mb-4"
      data-testid="error-accion"
      @click:close="errorAccion = ''"
    />

    <v-row>
      <v-col
        v-for="grupo in grupos"
        :key="grupo.titulo"
        cols="12"
        md="6"
      >
        <v-card :title="grupo.titulo">
          <v-progress-linear
            v-if="grupo.esTitular"
            :model-value="(titulares.length / MAX_TITULARES) * 100"
            color="primary"
          />
          <v-list>
            <v-list-item
              v-for="jugador in grupo.jugadores"
              :key="jugador.id"
              :title="jugador.nickname"
              data-testid="jugador-en-roster"
            >
              <template #prepend>
                <v-chip
                  :text="jugador.rol"
                  size="small"
                  variant="tonal"
                  class="me-3 etiqueta-rol"
                />
              </template>
              <template
                v-if="auth.esAdmin"
                #append
              >
                <v-btn
                  :icon="grupo.esTitular ? 'mdi-arrow-down' : 'mdi-arrow-up'"
                  variant="text"
                  size="small"
                  :aria-label="grupo.esTitular ? `Pasar ${jugador.nickname} a suplente` : `Hacer titular a ${jugador.nickname}`"
                  @click="cambiarRol(jugador)"
                />
                <v-btn
                  icon="mdi-close"
                  variant="text"
                  size="small"
                  color="error"
                  :aria-label="`Quitar a ${jugador.nickname}`"
                  @click="pedirQuitar(jugador)"
                />
              </template>
            </v-list-item>
            <v-list-item
              v-if="grupo.jugadores.length === 0"
              subtitle="Sin jugadores"
            />
          </v-list>
        </v-card>
      </v-col>
    </v-row>
  </template>

  <ConfirmarDialogo
    v-model="confirmacion"
    titulo="Quitar del roster"
    :texto="`¿Quitar a ${porQuitar?.nickname} de este roster? El jugador no se borra.`"
    :accion="quitar"
  />
</template>

<style scoped>
.campo-jugador {
  min-width: 240px;
}

/* Todas las etiquetas de rol del mismo ancho, para que los nombres queden alineados */
.etiqueta-rol {
  min-width: 72px;
  justify-content: center;
}
</style>
