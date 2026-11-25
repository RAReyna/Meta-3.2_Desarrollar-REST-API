<script setup lang="ts">
// Lista de rosters con filtros. Clic en una fila → detalle del roster.
// El admin además crea, edita y elimina.
import { computed, reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { useDisplay } from "vuetify";
import { api } from "@/api";
import { COLOR_TIPO } from "@/colores";
import { avisar } from "@/composables/aviso";
import { useRecurso } from "@/composables/useRecurso";
import { useAuthStore } from "@/stores/auth";
import { TIPOS_ROSTER, type Roster, type TipoRoster } from "@/types";
import ConfirmarDialogo from "@/components/ConfirmarDialogo.vue";
import RosterDialogo from "@/components/RosterDialogo.vue";

const auth = useAuthStore();
const router = useRouter();
const { smAndDown: esCelular } = useDisplay();

const {
  datos: rosters,
  cargando,
  error,
  recargar,
} = useRecurso(() => api.get<Roster[]>("/rosters"), []);

// Los filtros se aplican aquí mismo, sin volver a pedir los datos.
const filtros = reactive({
  tipo: null as TipoRoster | null,
  temporada: null as string | null,
});

// Las temporadas que existen, para el filtro.
const temporadas = computed(() => [...new Set(rosters.value.map((r) => r.temporada))].sort());

const visibles = computed(() =>
  rosters.value.filter(
    (r) =>
      (!filtros.tipo || r.tipo === filtros.tipo) &&
      (!filtros.temporada || r.temporada === filtros.temporada),
  ),
);

const columnas = computed(() => [
  { title: "Nombre", key: "nombre" },
  { title: "Tipo", key: "tipo" },
  { title: "Temporada", key: "temporada" },
  { title: "Jugadores", key: "cantidad_jugadores", align: "end" as const },
  ...(auth.esAdmin ? [{ title: "", key: "acciones", sortable: false, align: "end" as const }] : []),
]);

function verDetalle(_evento: Event, fila: { item: Roster }) {
  router.push(`/rosters/${fila.item.id}`);
}

// ---- Crear / editar ----
const dialogo = ref(false);
const editando = ref<Roster | null>(null);

function abrirFormulario(roster: Roster | null) {
  editando.value = roster;
  dialogo.value = true;
}

function alGuardar() {
  avisar(editando.value ? "Roster actualizado" : "Roster creado");
  recargar();
}

// ---- Eliminar ----
const confirmacion = ref(false);
const porEliminar = ref<Roster | null>(null);

function pedirEliminar(roster: Roster) {
  porEliminar.value = roster;
  confirmacion.value = true;
}

async function eliminar() {
  if (!porEliminar.value) return;
  await api.del(`/rosters/${porEliminar.value.id}`);
  avisar("Roster eliminado");
  recargar();
}
</script>

<template>
  <div class="d-flex align-center mb-4">
    <h1 class="text-headline-medium">Rosters</h1>
    <v-spacer />
    <v-btn
      v-if="auth.esAdmin"
      color="primary"
      prepend-icon="mdi-plus"
      text="Nuevo roster"
      data-testid="nuevo-roster"
      @click="abrirFormulario(null)"
    />
  </div>

  <v-row density="compact">
    <v-col cols="6" md="3">
      <v-select v-model="filtros.tipo" label="Tipo" :items="TIPOS_ROSTER" clearable />
    </v-col>
    <v-col cols="6" md="3">
      <v-select v-model="filtros.temporada" label="Temporada" :items="temporadas" clearable />
    </v-col>
  </v-row>

  <v-alert v-if="error" type="error" :text="error" class="mb-4" />

  <v-data-table
    :headers="columnas"
    :items="visibles"
    :loading="cargando"
    :mobile="esCelular"
    hover
    no-data-text="No hay rosters que coincidan"
    data-testid="tabla-rosters"
    @click:row="verDetalle"
  >
    <template #item.tipo="{ value }">
      <v-chip :text="value" :color="COLOR_TIPO[value as TipoRoster]" size="small" />
    </template>
    <template #item.acciones="{ item }">
      <!-- .stop: el clic en el botón no abre el detalle -->
      <v-btn
        icon="mdi-pencil"
        variant="text"
        size="small"
        :aria-label="`Editar ${item.nombre}`"
        @click.stop="abrirFormulario(item)"
      />
      <v-btn
        icon="mdi-delete"
        variant="text"
        size="small"
        color="error"
        :aria-label="`Eliminar ${item.nombre}`"
        @click.stop="pedirEliminar(item)"
      />
    </template>
  </v-data-table>

  <RosterDialogo v-model="dialogo" :roster="editando" @guardado="alGuardar" />
  <ConfirmarDialogo
    v-model="confirmacion"
    titulo="Eliminar roster"
    :texto="`¿Eliminar ${porEliminar?.nombre}? Sus jugadores no se borran.`"
    :accion="eliminar"
  />
</template>
