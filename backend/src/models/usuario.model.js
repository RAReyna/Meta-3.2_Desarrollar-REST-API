const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const Usuario = sequelize.define(
  "Usuario",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    email: { type: DataTypes.STRING(255), allowNull: false, unique: true },
    password_hash: { type: DataTypes.STRING(255), allowNull: true },
    google_id: { type: DataTypes.STRING(64), allowNull: true, unique: true },
    rol: {
      type: DataTypes.ENUM("admin", "public"),
      allowNull: false,
      defaultValue: "public",
    },
  },
  { tableName: "usuarios", timestamps: false },
);

module.exports = Usuario;
