const fs = require("fs");
const path = require("path");
const express = require("express");
const swaggerUi = require("swagger-ui-express");
const yaml = require("js-yaml");
const { manejarErrores } = require("./errors");

const openapi = yaml.load(
  fs.readFileSync(path.join(__dirname, "..", "openapi.yaml"), "utf8"),
);

const app = express();
app.use(express.json());

app.use("/api/v1", require("./routes/auxiliares.routes"));
app.use("/api/v1", require("./routes/jugadores.routes"));
app.use("/api/v1", require("./routes/rosters.routes"));

app.use("/docs", swaggerUi.serve, swaggerUi.setup(openapi));
app.get("/openapi.json", (req, res) => res.json(openapi));

app.use((req, res) => res.status(404).json({ error: "Ruta no encontrada" }));
app.use(manejarErrores);

module.exports = app;
