class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function manejarErrores(err, req, res, next) {
  if (err.name === 'ZodError')
    return res.status(400).json({ error: 'Datos inválidos', detalles: err.issues });
  if (err.code === 'SQLITE_CONSTRAINT_UNIQUE')
    return res.status(409).json({ error: 'Registro duplicado' });

  const status = err.status || 500;
  if (status === 500) console.error(err);
  res.status(status).json({ error: status === 500 ? 'Error interno' : err.message });
}

module.exports = { HttpError, manejarErrores };