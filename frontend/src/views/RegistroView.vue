<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import type { SubmitEventPromise } from "vuetify";
import { ApiError } from "@/api";
import { textoError } from "@/errores";
import { useAuthStore } from "@/stores/auth";

const auth = useAuthStore();
const router = useRouter();

const email = ref("");
const password = ref("");
const error = ref("");
const enviando = ref(false);

// Mismas reglas que valida el backend (Zod); el backend sigue siendo quien decide.
const reglasPassword = [
  (v: string) => v.length >= 8 || "Mínimo 8 caracteres",
  (v: string) => v.length <= 72 || "Máximo 72 caracteres",
];

// Registro abierto: el backend crea la cuenta con rol public y abre la sesión.
async function crearCuenta(evento: SubmitEventPromise) {
  if (!(await evento).valid) return;
  error.value = "";
  enviando.value = true;
  try {
    await auth.registro(email.value, password.value);
    router.push("/");
  } catch (err) {
    error.value =
      err instanceof ApiError && err.status === 409
        ? "Ese email ya está registrado"
        : textoError(err);
  } finally {
    enviando.value = false;
  }
}
</script>

<template>
  <v-card
    class="mx-auto mt-8"
    max-width="420"
    title="Crear cuenta"
    subtitle="Las cuentas nuevas son de solo lectura"
  >
    <v-card-text>
      <v-form @submit.prevent="crearCuenta">
        <v-text-field
          v-model="email"
          label="Email"
          type="email"
          autocomplete="email"
          required
          data-testid="registro-email"
        />
        <v-text-field
          v-model="password"
          label="Contraseña (8 a 72 caracteres)"
          type="password"
          autocomplete="new-password"
          :rules="reglasPassword"
          required
          data-testid="registro-password"
        />
        <v-alert
          v-if="error"
          type="error"
          :text="error"
          class="mb-4"
          data-testid="registro-error"
        />
        <v-btn
          type="submit"
          color="primary"
          block
          :loading="enviando"
          data-testid="registro-submit"
        >
          Crear cuenta
        </v-btn>
      </v-form>
    </v-card-text>
    <v-card-actions class="justify-center">
      ¿Ya tienes cuenta?
      <v-btn
        to="/login"
        variant="text"
      >
        Inicia sesión
      </v-btn>
    </v-card-actions>
  </v-card>
</template>
