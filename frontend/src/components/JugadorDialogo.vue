<script setup>
// Formulario para crear un jugador (jugador = null) o editar uno existente.
import { ref, watch } from "vue";
import { api } from "@/api";
import { textoError } from "@/errores";
import { ESTADOS, ROLES } from "@/constantes";

const abierto = defineModel({ type: Boolean, required: true });
const props = defineProps({ jugador: { type: Object, default: null } });
const emit = defineEmits(["guardado"]);

const vacio = () => ({
  nickname: "",
  nombre_real: "",
  pais: "",
  rol: "Top",
  estado: "activo",
});

const form = ref(vacio());
const error = ref("");
const enviando = ref(false);
const requerido = (v) => v.trim() !== "" || "Obligatorio";

// Cada vez que se abre, llena el formulario con el jugador a editar o lo deja vacío.
watch(abierto, (estaAbierto) => {
  if (!estaAbierto) return;
  error.value = "";
  const j = props.jugador;
  form.value = j
    ? {
        nickname: j.nickname,
        nombre_real: j.nombre_real ?? "",
        pais: j.pais ?? "",
        rol: j.rol,
        estado: j.estado,
      }
    : vacio();
});

async function guardar(evento) {
  if (!(await evento).valid) return;
  enviando.value = true;
  error.value = "";

  // Los campos opcionales vacíos no se envían: el backend los guarda como null.
  const datos = {
    ...form.value,
    nombre_real: form.value.nombre_real?.trim() || undefined,
    pais: form.value.pais?.trim() || undefined,
  };

  try {
    if (props.jugador) await api.put(`/jugadores/${props.jugador.id}`, datos);
    else await api.post("/jugadores", datos);
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
  <v-dialog v-model="abierto" max-width="480">
    <v-card :title="jugador ? 'Editar jugador' : 'Nuevo jugador'">
      <v-form @submit.prevent="guardar">
        <v-card-text>
          <v-text-field
            v-model="form.nickname"
            label="Nickname"
            :rules="[requerido]"
            data-testid="jugador-nickname"
          />
          <v-text-field v-model="form.nombre_real" label="Nombre real (opcional)" />
          <v-text-field v-model="form.pais" label="País (opcional)" />
          <v-select v-model="form.rol" label="Rol" :items="ROLES" data-testid="jugador-rol" />
          <v-select v-model="form.estado" label="Estado" :items="ESTADOS" />
          <v-alert v-if="error" type="error" :text="error" data-testid="jugador-error" />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn text="Cancelar" @click="abierto = false" />
          <v-btn
            type="submit"
            color="primary"
            text="Guardar"
            :loading="enviando"
            data-testid="jugador-guardar"
          />
        </v-card-actions>
      </v-form>
    </v-card>
  </v-dialog>
</template>
