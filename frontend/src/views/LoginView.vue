<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { ApiError } from "@/api";
import { useAuthStore } from "@/stores/auth";

const auth = useAuthStore();
const router = useRouter();

const email = ref("");
const password = ref("");
const error = ref("");
const enviando = ref(false);

async function entrar() {
  error.value = "";
  enviando.value = true;
  try {
    await auth.login(email.value, password.value);
    router.push("/");
  } catch (err) {
    error.value =
      err instanceof ApiError && err.status === 401
        ? "Email o contraseña incorrectos"
        : "No se pudo iniciar sesión";
  } finally {
    enviando.value = false;
  }
}
</script>

<template>
  <v-card
    class="mx-auto mt-8"
    max-width="420"
    title="Iniciar sesión"
  >
    <v-card-text>
      <v-form @submit.prevent="entrar">
        <v-text-field
          v-model="email"
          label="Email"
          type="email"
          autocomplete="email"
          required
          data-testid="login-email"
        />
        <v-text-field
          v-model="password"
          label="Contraseña"
          type="password"
          autocomplete="current-password"
          required
          data-testid="login-password"
        />
        <v-alert
          v-if="error"
          type="error"
          :text="error"
          class="mb-4"
          data-testid="login-error"
        />
        <v-btn
          type="submit"
          color="primary"
          block
          :loading="enviando"
          data-testid="login-submit"
        >
          Entrar
        </v-btn>
      </v-form>
    </v-card-text>
    <v-card-actions class="justify-center">
      ¿No tienes cuenta?
      <v-btn
        to="/registro"
        variant="text"
        data-testid="link-registro"
      >
        Regístrate
      </v-btn>
    </v-card-actions>
  </v-card>
</template>
