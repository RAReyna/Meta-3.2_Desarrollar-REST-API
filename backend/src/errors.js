class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

// Convierte un parámetro de ruta en id válido; si no lo es, responde 404
const idValido = (valor) => {
  const id = Number(valor);
  if (!Number.isInteger(id) || id < 1)
    throw new HttpError(404, "Recurso no encontrado");
  return id;
};

function manejarErrores(err, req, res, next) {
  if (err.name === "ZodError")
    return res
      .status(400)
      .json({ error: "Datos inválidos", detalles: err.issues });
  if (err.name === "SequelizeUniqueConstraintError")
    return res.status(409).json({ error: "Registro duplicado" });
  if (err.original && err.original.code === "ER_DATA_TOO_LONG")
    return res.status(400).json({
      error: "Datos inválidos",
      detalles: [{ message: "Un campo excede la longitud máxima" }],
    });

  const status = err.status || 500;
  if (status === 500) console.error(err);
  res
    .status(status)
    .json({ error: status === 500 ? "Error interno" : err.message });
}

module.exports = { HttpError, idValido, manejarErrores };
