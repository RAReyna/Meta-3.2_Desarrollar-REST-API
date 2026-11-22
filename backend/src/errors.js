// Error con código HTTP: los services lo lanzan y manejarErrores lo responde.
export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

// Convierte un parámetro de ruta en id válido; si no lo es, responde 404.
export function idValido(valor) {
  const id = Number(valor);
  if (!Number.isInteger(id) || id < 1) {
    throw new HttpError(404, "Recurso no encontrado");
  }
  return id;
}

// Middleware final de Express: traduce cualquier error a una respuesta JSON.
export function manejarErrores(err, req, res, next) {
  if (err.name === "ZodError") {
    return res
      .status(400)
      .json({ error: "Datos inválidos", detalles: err.issues });
  }

  // Errores de MySQL
  if (err.code === "ER_DUP_ENTRY") {
    return res.status(409).json({ error: "Registro duplicado" });
  }
  if (err.code === "ER_DATA_TOO_LONG") {
    return res.status(400).json({
      error: "Datos inválidos",
      detalles: [{ message: "Un campo excede la longitud máxima" }],
    });
  }

  const status = err.status || 500;
  if (status === 500) console.error(err);
  res
    .status(status)
    .json({ error: status === 500 ? "Error interno" : err.message });
}
