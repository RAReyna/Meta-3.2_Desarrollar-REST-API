import { readFileSync } from "node:fs";
import express from "express";
import cookieParser from "cookie-parser";
import swaggerUi from "swagger-ui-express";
import { load } from "js-yaml";
import { manejarErrores } from "./errors.js";
import { protegerApi } from "./middleware/auth.js";
import authRoutes from "./routes/auth.routes.js";
import auxiliaresRoutes from "./routes/auxiliares.routes.js";
import jugadoresRoutes from "./routes/jugadores.routes.js";
import rostersRoutes from "./routes/rosters.routes.js";

// Falla al arrancar, no en la primera petición.
if (!process.env.JWT_SECRET) {
  throw new Error("Falta JWT_SECRET en el .env");
}

const openapi = load(
  readFileSync(new URL("../openapi.yaml", import.meta.url), "utf8"),
);

const app = express();
app.use(express.json());
app.use(cookieParser());

// Sin protección: login/registro, y health + catálogos (no contienen datos).
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1", auxiliaresRoutes);

// A partir de aquí todo exige sesión; POST/PUT/DELETE además admin + CSRF.
app.use("/api/v1", protegerApi);
app.use("/api/v1", jugadoresRoutes);
app.use("/api/v1", rostersRoutes);

app.use("/docs", swaggerUi.serve, swaggerUi.setup(openapi));
app.get("/openapi.json", (req, res) => res.json(openapi));

app.use((req, res) => res.status(404).json({ error: "Ruta no encontrada" }));
app.use(manejarErrores);

export default app;
