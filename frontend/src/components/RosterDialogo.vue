<script setup lang="ts">
// Formulario para crear un roster (roster = null) o editar uno existente.
import { ref, watch } from "vue";
import type { SubmitEventPromise } from "vuetify";
import { api } from "@/api";
import { textoError } from "@/errores";
import { TIPOS_ROSTER, type Roster, type RosterInput } from "@/types";

const abierto = defineModel<boolean>({ required: true });
const props = defineProps<{ roster: Roster | null }>();
const emit = defineEmits<{ guardado: [] }>();

const vacio = (): RosterInput => ({
  nombre: "",
  tipo: "Principal",
  temporada: String(new Date().getFullYear()),
});

const form = ref<RosterInput>(vacio());
const error = ref("");
const enviando = ref(false);
const requerido = (v: string) => v.trim() !== "" || "Obligatorio";

// Cada vez que se abre, llena el formulario con el roster a editar o lo deja vacío.
watch(abierto, (estaAbierto) => {
  if (!estaAbierto) return;
  error.value = "";
  const r = props.roster;
  form.value = r ? { nombre: r.nombre, tipo: r.tipo, temporada: r.temporada } : vacio();
});

async function guardar(evento: SubmitEventPromise) {
  if (!(await evento).valid) return;
  enviando.value = true;
  error.value = "";
  try {
    if (props.roster) await api.put(`/rosters/${props.roster.id}`, form.value);
    else await api.post("/rosters", form.value);
    emit("guardado");
    abierto.value = false;
  } catch (err) {
    error.value = textoError(err);
  } finally {
    enviando.value = false;
  }
}
</script>

<template>
  <v-dialog
    v-model="abierto"
    max-width="480"
  >
    <v-card :title="roster ? 'Editar roster' : 'Nuevo roster'">
      <v-form @submit.prevent="guardar">
        <v-card-text>
          <v-text-field
            v-model="form.nombre"
            label="Nombre"
            :rules="[requerido]"
            data-testid="roster-nombre"
          />
          <v-select
            v-model="form.tipo"
            label="Tipo"
            :items="TIPOS_ROSTER"
          />
          <v-text-field
            v-model="form.temporada"
            label="Temporada"
            :rules="[requerido]"
          />
          <v-alert
            v-if="error"
            type="error"
            :text="error"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            text="Cancelar"
            @click="abierto = false"
          />
          <v-btn
            type="submit"
            color="primary"
            text="Guardar"
            :loading="enviando"
            data-testid="roster-guardar"
          />
        </v-card-actions>
      </v-form>
    </v-card>
  </v-dialog>
</template>
