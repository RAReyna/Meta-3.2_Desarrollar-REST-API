require("dotenv").config();
const bcrypt = require("bcryptjs");
const Usuario = require("../src/models/usuario.model");

(async () => {
  const email = (process.env.ADMIN_EMAIL || "").toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) {
    console.error("Define ADMIN_EMAIL y ADMIN_PASSWORD en el .env");
    process.exit(1);
  }

  const password_hash = await bcrypt.hash(password, 10);
  const [usuario, creado] = await Usuario.findOrCreate({
    where: { email },
    defaults: { password_hash, rol: "admin" },
  });
  if (!creado) await usuario.update({ password_hash, rol: "admin" });

  console.log(`${creado ? "Admin creado" : "Admin actualizado"}: ${email}`);
  await Usuario.sequelize.close();
})();
