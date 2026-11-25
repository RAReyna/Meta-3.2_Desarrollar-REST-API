import pluginVue from "eslint-plugin-vue";
import { defineConfigWithVueTs, vueTsConfigs } from "@vue/eslint-config-typescript";

export default defineConfigWithVueTs(
  { ignores: ["dist", "playwright-report", "test-results"] },
  pluginVue.configs["flat/recommended"],
  vueTsConfigs.recommended,
  // Permite los slots de Vuetify con punto, como #item.acciones
  { rules: { "vue/valid-v-slot": ["error", { allowModifiers: true }] } },
);
