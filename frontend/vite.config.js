import { fileURLToPath } from "node:url";
import vue from "@vitejs/plugin-vue";
import vuetify from "vite-plugin-vuetify";
import { defineConfig } from "vite";

export default defineConfig({
  // vuetify: importa solo los componentes que se usan.
  plugins: [vue(), vuetify({ autoImport: true })],
  resolve: {
    // "@/..." apunta a src/
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  server: {
    port: 5173,
    // El navegador solo habla con Vite; Vite reenvía /api al backend.
    // Así las cookies SameSite=Strict funcionan sin configurar CORS.
    proxy: { "/api": "http://localhost:3000" },
  },
});
