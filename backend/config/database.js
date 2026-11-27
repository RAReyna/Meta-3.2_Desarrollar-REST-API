// Conexión a MySQL, tomada del .env. La usan la app (src/db.js) y
// sequelize-cli (npm run db:migrate), por eso exporta un objeto por entorno.
import "dotenv/config";

const base = {
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  host: process.env.DB_HOST || "127.0.0.1",
  port: Number(process.env.DB_PORT) || 3306,
  dialect: "mysql",
  define: { charset: "utf8mb4", collate: "utf8mb4_unicode_ci" },
  logging: false,
};

export default { development: base, test: base, production: base };
