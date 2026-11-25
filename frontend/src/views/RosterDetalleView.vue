<script setup lang="ts">
// Detalle de un roster: titulares y suplentes. El admin además asigna
// jugadores, cambia su rol en el roster y los quita.
import { computed, ref } from "vue";
import { useRoute } from "vue-router";
import { api } from "@/api";
import { COLOR_TIPO } from "@/colores";
import { avisar } from "@/composables/aviso";
import { useRecurso } from "@/composables/useRecurso";
import { textoError } from "@/errores";
import { useAuthStore } from "@/stores/auth";
import { ROLES, type JugadorEnRoster, type RolEnRoster, type RosterDetalle } from "@/types";
import AsignarJugador from "@/components/AsignarJugador.vue";
import ConfirmarDialogo from "@/components/ConfirmarDialogo.vue";

const MAX_TITULARES = 5;

const auth = useAuthStore();
const id = Number(useRoute().params.id);

const {
  datos: roster,
  cargando,
  error,
  recargar,
} = useRecurso<RosterDetalle | null>(() => api.get(`/rosters/${id}`), null);

// Los jugadores del roster con ese rol (titular o suplente), ordenados por
// su posición en el juego (Top, Jungle, Mid...).
function jugadoresCon(rolEnRoster: RolEnRoster) {
  return (roster.value?.jugadores ?? [])
    .filter((j) => j.rol_en_roster === rolEnRoster)
    .sort((a, b) => ROLES.indexOf(a.rol) - ROLES.indexOf(b.rol));
}
const titulares = computed(() => jugadoresCon("Titular"));
const suplentes = computed(() => jugadoresCon("Suplente"));

const grupos = computed(() => [
  {
    titulo: `Titulares (${titulares.value.length}/${MAX_TITULARES})`,
    jugadores: titulares.value,
    esTitular: true,
  },
  { titulo: `Suplentes (${suplentes.value.length})`, jugadores: suplentes.value, esTitular: false },
]);

const migas = computed(() => [
  { title: "Rosters", to: "/rosters" },
  { title: roster.value?.nombre ?? "…", disabled: true },
]);

// ---- Acciones del admin ----

const idsEnRoster = computed(() => roster.value?.jugadores.map((j) => j.id) ?? []);

function alAsignar() {
  avisar("Jugador asignado");
  recargar();
}

// Error al cambiar un rol: el backend rechaza un sexto titular o un rol repetido.
const errorAccion = ref("");

async function cambiarRol(jugador: JugadorEnRoster) {
  const rol_en_roster = jugador.rol_en_roster === "Titular" ? "Suplente" : "Titular";
  errorAccion.value = "";
  try {
    await api.put(`/rosters/${id}/jugadores/${jugador.id}`, { rol_en_roster });
    avisar(`${jugador.nickname} ahora es ${rol_en_roster.toLowerCase()}`);
    recargar();
  } catch (err) {
    errorAccion.value = textoError(err);
  }
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
  <v-breadcrumbs :items="migas" class="px-0" />

  <v-alert v-if="error" type="error" :text="error" />
  <v-progress-linear v-else-if="cargando && !roster" indeterminate />

  <template v-if="roster">
    <div class="d-flex flex-wrap align-center ga-2 mb-4">
      <h1 class="text-headline-medium me-2">
        {{ roster.nombre }}
      </h1>
      <v-chip :text="roster.tipo" :color="COLOR_TIPO[roster.tipo]" size="small" />
      <v-chip :text="`Temporada ${roster.temporada}`" size="small" variant="outlined" />
      <v-chip :text="roster.juego" size="small" variant="outlined" />
    </div>

    <AsignarJugador
      v-if="auth.esAdmin"
      :id-roster="id"
      :ya-en-roster="idsEnRoster"
      class="mb-4"
      @asignado="alAsignar"
    />

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
      <v-col v-for="grupo in grupos" :key="grupo.titulo" cols="12" md="6">
        <v-card :title="grupo.titulo" :data-testid="grupo.esTitular ? 'titulares' : 'suplentes'">
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
              <template v-if="auth.esAdmin" #append>
                <v-btn
                  :icon="grupo.esTitular ? 'mdi-arrow-down' : 'mdi-arrow-up'"
                  variant="text"
                  size="small"
                  :aria-label="
                    grupo.esTitular
                      ? `Pasar ${jugador.nickname} a suplente`
                      : `Hacer titular a ${jugador.nickname}`
                  "
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
            <v-list-item v-if="grupo.jugadores.length === 0" subtitle="Sin jugadores" />
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
/* Todas las etiquetas de rol del mismo ancho, para que los nombres queden alineados */
.etiqueta-rol {
  min-width: 72px;
  justify-content: center;
}
</style>
