"use strict";
const { Model } = require("sequelize");
const { ROLES, ESTADOS } = require("../src/constantes.js");

module.exports = (sequelize, DataTypes) => {
  class Jugador extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      this.belongsToMany(models.Roster, {
        through: models.RosterJugador,
        foreignKey: "id_jugador",
        otherKey: "id_roster",
        as: { singular: "roster", plural: "rosters" },
      });
      // Acceso directo a sus filas de la tabla intermedia.
      this.hasMany(models.RosterJugador, {
        foreignKey: "id_jugador",
        as: "asignaciones",
      });
    }
  }

  Jugador.init(
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
    {
      sequelize,
      modelName: "Jugador",
      tableName: "jugadores",
      timestamps: false,
    },
  );
  return Jugador;
};
