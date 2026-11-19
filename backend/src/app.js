const fs = require("fs");
const path = require("path");
const express = require("express");
const cookieParser = require("cookie-parser");
const swaggerUi = require("swagger-ui-express");
const yaml = require("js-yaml");
const { manejarErrores } = require("./errors");
const { protegerEscrituras } = require("./middleware/auth");

const openapi = yaml.load(
  fs.readFileSync(path.join(__dirname, "..", "openapi.yaml"), "utf8"),
);

const app = express();
app.use(express.json());
app.use(cookieParser());

// Auth primero: el login no debe pasar por la protección de escrituras.
app.use("/api/v1/auth", require("./routes/auth.routes"));

// A partir de aquí, POST/PUT/DELETE exigen admin + JWT + CSRF.
app.use("/api/v1", protegerEscrituras);

app.use("/api/v1", require("./routes/auxiliares.routes"));
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
