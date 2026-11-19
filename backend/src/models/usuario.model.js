const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const Usuario = sequelize.define(
  "Usuario",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    email: { type: DataTypes.STRING(255), allowNull: false, unique: true },
    password_hash: { type: DataTypes.STRING(255), allowNull: false },
    rol: {
      type: DataTypes.ENUM("admin", "public"),
      allowNull: false,
      defaultValue: "public",
    },
  },
  { tableName: "usuarios", timestamps: false },
);

module.exports = Usuario;