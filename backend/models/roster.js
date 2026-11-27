"use strict";
const { Model } = require("sequelize");
const { TIPOS_ROSTER } = require("../src/constantes.js");

module.exports = (sequelize, DataTypes) => {
  class Roster extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      this.belongsToMany(models.Jugador, {
        through: models.RosterJugador,
        foreignKey: "id_roster",
        otherKey: "id_jugador",
        as: { singular: "jugador", plural: "jugadores" },
      });
      // Acceso directo a sus filas de la tabla intermedia (para contarlas).
      this.hasMany(models.RosterJugador, {
        foreignKey: "id_roster",
        as: "asignaciones",
      });
    }
  }

  Roster.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      nombre: { type: DataTypes.STRING(255), allowNull: false },
      juego: {
        type: DataTypes.STRING(255),
        allowNull: false,
        defaultValue: "League of Legends",
      },
      tipo: { type: DataTypes.ENUM(...TIPOS_ROSTER), allowNull: false },
      temporada: { type: DataTypes.STRING(255), allowNull: false },
    },
    {
      sequelize,
      modelName: "Roster",
      tableName: "rosters",
      timestamps: false,
    },
  );
  return Roster;
};
