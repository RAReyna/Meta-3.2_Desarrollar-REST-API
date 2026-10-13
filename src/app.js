const express = require("express");
const { manejarErrores } = require("./errors");

const app = express();
app.use(express.json());

app.use("/api/v1", require("./routes/auxiliares.routes"));
app.use("/api/v1", require("./routes/jugadores.routes"));
app.use("/api/v1", require("./routes/rosters.routes"));
// Aquí se agregarán rosters

app.use((req, res) => res.status(404).json({ error: "Ruta no encontrada" }));
app.use(manejarErrores);

module.exports = app;
