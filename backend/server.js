import "dotenv/config"; // primero: las demás importaciones leen process.env
import app from "./src/app.js";
import sequelize from "./src/db.js";

const PORT = process.env.PORT || 3000;

try {
  await sequelize.authenticate();
} catch (err) {
  console.error("No se pudo conectar a MySQL:", err.message);
  console.error(
    "Revisa que el servicio esté activo (sudo service mysql start), el .env y que corriste npm run db:migrate",
  );
  process.exit(1);
}

app.listen(PORT, () => console.log(`API en http://localhost:${PORT}/api/v1`));
