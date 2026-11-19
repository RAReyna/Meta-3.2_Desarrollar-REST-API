const { DataTypes } = require("sequelize");
const sequelize = require("../db");
const { ROLES, ESTADOS } = require("../constantes");

const Jugador = sequelize.define(
  "Jugador",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    nickname: { type: DataTypes.STRING(255), allowNull: false, unique: true },
    nombre_real: { type: DataTypes.STRING(255), allowNull: true },
    pais: { type: DataTypes.STRING(255), allowNull: true },
    rol: { type: DataTypes.ENUM(...ROLES), allowNull: false },
    estado: {
      type: DataTypes.ENUM(...ESTADOS),
      allowNull: false,
      defaultValue: "activo",
    },
  },
  { tableName: "jugadores", timestamps: false },
);

module.exports = Jugador;
