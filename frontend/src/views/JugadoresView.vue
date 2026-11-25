<script setup lang="ts">
// Lista de jugadores con búsqueda y filtros. El admin además crea, edita y elimina.
import { computed, reactive, ref } from "vue";
import { useDisplay } from "vuetify";
import { api } from "@/api";
import { COLOR_ESTADO } from "@/colores";
import { avisar } from "@/composables/aviso";
import { useRecurso } from "@/composables/useRecurso";
import { useAuthStore } from "@/stores/auth";
import { ESTADOS, ROLES, type EstadoJugador, type Jugador, type RolJugador } from "@/types";
import ConfirmarDialogo from "@/components/ConfirmarDialogo.vue";
import JugadorDialogo from "@/components/JugadorDialogo.vue";

const auth = useAuthStore();
const { smAndDown: esCelular } = useDisplay();

const { datos: jugadores, cargando, error, recargar } = useRecurso(
  () => api.get<Jugador[]>("/jugadores"),
  [],
);

// Los filtros se aplican aquí mismo, sin volver a pedir los datos.
const filtros = reactive({
  texto: "" as string | null,
  rol: null as RolJugador | null,
  estado: null as EstadoJugador | null,
});

const visibles = computed(() => {
  const texto = (filtros.texto ?? "").toLowerCase();
  return jugadores.value.filter(
    (j) =>
      j.nickname.toLowerCase().includes(texto) &&
      (!filtros.rol || j.rol === filtros.rol) &&
      (!filtros.estado || j.estado === filtros.estado),
  );
});

const columnas = computed(() => [
  { title: "Nickname", key: "nickname" },
  { title: "Nombre real", key: "nombre_real" },
  { title: "País", key: "pais" },
  { title: "Rol", key: "rol" },
  { title: "Estado", key: "estado" },
  ...(auth.esAdmin ? [{ title: "", key: "acciones", sortable: false, align: "end" as const }] : []),
]);

// ---- Crear / editar ----
const dialogo = ref(false);
const editando = ref<Jugador | null>(null);

function abrirFormulario(jugador: Jugador | null) {
  editando.value = jugador;
  dialogo.value = true;
}

function alGuardar() {
  avisar(editando.value ? "Jugador actualizado" : "Jugador creado");
  recargar();
}

// ---- Eliminar ----
const confirmacion = ref(false);
const porEliminar = ref<Jugador | null>(null);

function pedirEliminar(jugador: Jugador) {
  porEliminar.value = jugador;
  confirmacion.value = true;
}

async function eliminar() {
  if (!porEliminar.value) return;
  await api.del(`/jugadores/${porEliminar.value.id}`);
  avisar("Jugador eliminado");
  recargar();
}
</script>

<template>
  <div class="d-flex align-center mb-4">
    <h1 class="text-headline-medium">
      Jugadores
    </h1>
    <v-spacer />
    <v-btn
      v-if="auth.esAdmin"
      color="primary"
      prepend-icon="mdi-plus"
      text="Nuevo jugador"
      data-testid="nuevo-jugador"
      @click="abrirFormulario(null)"
    />
  </div>

  <v-row dense>
    <v-col
      cols="12"
      md="6"
    >
      <v-text-field
        v-model="filtros.texto"
        label="Buscar por nickname"
        prepend-inner-icon="mdi-magnify"
        clearable
        data-testid="buscar-jugador"
      />
    </v-col>
    <v-col
      cols="6"
      md="3"
    >
      <v-select
        v-model="filtros.rol"
        label="Rol"
        :items="ROLES"
        clearable
      />
    </v-col>
    <v-col
      cols="6"
      md="3"
    >
      <v-select
        v-model="filtros.estado"
        label="Estado"
        :items="ESTADOS"
        clearable
      />
    </v-col>
  </v-row>

  <v-alert
    v-if="error"
    type="error"
    :text="error"
    class="mb-4"
  />

  <v-data-table
    :headers="columnas"
    :items="visibles"
    :loading="cargando"
    :mobile="esCelular"
    no-data-text="No hay jugadores que coincidan"
    data-testid="tabla-jugadores"
  >
    <template #item.nombre_real="{ value }">
      {{ value ?? "—" }}
    </template>
    <template #item.pais="{ value }">
      {{ value ?? "—" }}
    </template>
    <template #item.rol="{ value }">
      <v-chip
        :text="value"
        size="small"
        variant="tonal"
      />
    </template>
    <template #item.estado="{ value }">
      <v-chip
        :text="value"
        :color="COLOR_ESTADO[value as EstadoJugador]"
        size="small"
      />
    </template>
    <template #item.acciones="{ item }">
      <v-btn
        icon="mdi-pencil"
        variant="text"
        size="small"
        :aria-label="`Editar ${item.nickname}`"
        @click="abrirFormulario(item)"
      />
      <v-btn
        icon="mdi-delete"
        variant="text"
        size="small"
        color="error"
        :aria-label="`Eliminar ${item.nickname}`"
        @click="pedirEliminar(item)"
      />
    </template>
  </v-data-table>

  <JugadorDialogo
    v-model="dialogo"
    :jugador="editando"
    @guardado="alGuardar"
  />
  <ConfirmarDialogo
    v-model="confirmacion"
    titulo="Eliminar jugador"
    :texto="`¿Eliminar a ${porEliminar?.nickname}? También saldrá de los rosters donde esté.`"
    :accion="eliminar"
  />
</template>
