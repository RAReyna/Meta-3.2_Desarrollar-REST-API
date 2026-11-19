require("dotenv").config();
const app = require("./src/app");
const sequelize = require("./src/db");

const PORT = process.env.PORT || 3000;

sequelize
  .authenticate()
  .then(() =>
    app.listen(PORT, () =>
      console.log(`API en http://localhost:${PORT}/api/v1`),
    ),
  )
  .catch((err) => {
    console.error("No se pudo conectar a MySQL:", err.message);
    console.error(
      "Revisa que el servicio esté activo (sudo service mysql start), el .env y que corriste npm run db:migrate",
    );
    process.exit(1);
  });
