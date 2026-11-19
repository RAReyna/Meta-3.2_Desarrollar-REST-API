const fs = require("fs");
const path = require("path");
const express = require("express");
const cookieParser = require("cookie-parser");
const swaggerUi = require("swagger-ui-express");
const yaml = require("js-yaml");
const { manejarErrores } = require("./errors");
const { protegerApi } = require("./middleware/auth");

const openapi = yaml.load(
  fs.readFileSync(path.join(__dirname, "..", "openapi.yaml"), "utf8"),
);

const app = express();
app.use(express.json());
app.use(cookieParser());

// Sin protección: login/registro, y health + catálogos (no contienen datos).
app.use("/api/v1/auth", require("./routes/auth.routes"));
app.use("/api/v1", require("./routes/auxiliares.routes"));

// A partir de aquí todo exige sesión; POST/PUT/DELETE además admin + CSRF.
app.use("/api/v1", protegerApi);

app.use("/api/v1", require("./routes/jugadores.routes"));
app.use("/api/v1", require("./routes/rosters.routes"));

app.use("/docs", swaggerUi.serve, swaggerUi.setup(openapi));
app.get("/openapi.json", (req, res) => res.json(openapi));

app.use((req, res) => res.status(404).json({ error: "Ruta no encontrada" }));
app.use(manejarErrores);

// Falla al arrancar, no en la primera petición.
if (!process.env.JWT_SECRET) {
  throw new Error("Falta JWT_SECRET en el .env");
}

module.exports = app;
