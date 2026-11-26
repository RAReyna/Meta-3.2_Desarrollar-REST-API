import js from "@eslint/js";
import globals from "globals";
import pluginVue from "eslint-plugin-vue";
import skipFormatting from "@vue/eslint-config-prettier/skip-formatting";

export default [
  { ignores: ["dist", "playwright-report", "test-results"] },
  // El código de src/ corre en el navegador; los configs y e2e/, en Node.
  { files: ["src/**"], languageOptions: { globals: globals.browser } },
  { files: ["*.js", "e2e/**"], languageOptions: { globals: globals.node } },
  js.configs.recommended,
  ...pluginVue.configs["flat/recommended"],
  // Permite los slots de Vuetify con punto, como #item.acciones
  { rules: { "vue/valid-v-slot": ["error", { allowModifiers: true }] } },
  // El formato (espacios, saltos de línea) lo decide Prettier, no ESLint
  skipFormatting,
];
