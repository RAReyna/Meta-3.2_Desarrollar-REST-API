import pluginVue from "eslint-plugin-vue";
import { defineConfigWithVueTs, vueTsConfigs } from "@vue/eslint-config-typescript";
import skipFormatting from "@vue/eslint-config-prettier/skip-formatting";

export default defineConfigWithVueTs(
  { ignores: ["dist", "playwright-report", "test-results"] },
  pluginVue.configs["flat/recommended"],
  vueTsConfigs.recommended,
  // Permite los slots de Vuetify con punto, como #item.acciones
  { rules: { "vue/valid-v-slot": ["error", { allowModifiers: true }] } },
  // El formato (espacios, saltos de línea) lo decide Prettier, no ESLint
  skipFormatting,
);
