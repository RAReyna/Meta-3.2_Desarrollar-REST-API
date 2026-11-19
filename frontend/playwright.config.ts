import { fileURLToPath } from "node:url";
import { defineConfig, devices } from "@playwright/test";

// Credenciales del admin: se leen del mismo .env que usa el backend.
try {
  process.loadEnvFile(fileURLToPath(new URL("../backend/.env", import.meta.url)));
} catch {
  // Sin archivo: se valida abajo con un mensaje claro.
}
if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) {
  throw new Error("Define ADMIN_EMAIL y ADMIN_PASSWORD en backend/.env");
}

export default defineConfig({
  testDir: "./e2e",
  // Una sola base de datos compartida: las pruebas corren una por una.
  workers: 1,
  fullyParallel: false,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: "http://localhost:5173",
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  // Levanta backend y frontend si no están corriendo; si ya lo están, los reutiliza.
  webServer: [
    {
      command: "npm start",
      cwd: "../backend",
      url: "http://localhost:3000/api/v1/health",
      reuseExistingServer: true,
    },
    {
      command: "npm run dev",
      url: "http://localhost:5173",
      reuseExistingServer: true,
    },
  ],
});
